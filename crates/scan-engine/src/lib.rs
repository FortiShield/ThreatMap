use threatmap_detection_api::{
    CheckMetadata, EvidenceLocation, EvidenceSource, Finding, HttpExchange, Severity,
};

pub trait PassiveDetector: Send + Sync {
    fn id(&self) -> &'static str;
    fn analyze(&self, exchange: &HttpExchange) -> Option<Finding>;
}

pub struct ScanEngine {
    detectors: Vec<Box<dyn PassiveDetector>>,
    active_detectors: Vec<Box<dyn ActiveDetector>>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum SessionState {
    Pending,
    Running,
    Done,
    Cancelled,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct ScanProgress {
    pub completed: usize,
    pub total: usize,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum SessionError {
    NotStarted,
}

impl std::fmt::Display for SessionError {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::NotStarted => formatter.write_str("scan session has not been started"),
        }
    }
}

impl std::error::Error for SessionError {}

pub struct PassiveScanSession {
    id: String,
    exchanges: Vec<HttpExchange>,
    next_exchange: usize,
    findings: Vec<Finding>,
    state: SessionState,
}

impl PassiveScanSession {
    pub fn new(id: impl Into<String>, exchanges: Vec<HttpExchange>) -> Self {
        Self {
            id: id.into(),
            exchanges,
            next_exchange: 0,
            findings: Vec::new(),
            state: SessionState::Pending,
        }
    }

    pub fn id(&self) -> &str {
        &self.id
    }

    pub fn state(&self) -> SessionState {
        self.state
    }

    pub fn progress(&self) -> ScanProgress {
        ScanProgress {
            completed: self.next_exchange,
            total: self.exchanges.len(),
        }
    }

    pub fn findings(&self) -> &[Finding] {
        &self.findings
    }

    pub fn start(&mut self) -> bool {
        if self.state != SessionState::Pending {
            return false;
        }

        self.state = SessionState::Running;
        true
    }

    pub fn cancel(&mut self) -> bool {
        if !matches!(self.state, SessionState::Pending | SessionState::Running) {
            return false;
        }

        self.state = SessionState::Cancelled;
        true
    }

    pub fn advance(&mut self, engine: &ScanEngine) -> Result<bool, SessionError> {
        if self.state == SessionState::Pending {
            return Err(SessionError::NotStarted);
        }
        if self.state != SessionState::Running {
            return Ok(false);
        }
        if self.next_exchange == self.exchanges.len() {
            self.state = SessionState::Done;
            return Ok(false);
        }

        self.findings
            .extend(engine.analyze(&self.exchanges[self.next_exchange]));
        self.next_exchange += 1;
        if self.next_exchange == self.exchanges.len() {
            self.state = SessionState::Done;
        }
        Ok(true)
    }
}

impl ScanEngine {
    pub fn new(detectors: Vec<Box<dyn PassiveDetector>>) -> Self {
        Self {
            detectors,
            active_detectors: Vec::new(),
        }
    }

    pub fn with_default_detectors() -> Self {
        Self::new(vec![
            Box::new(ContentTypeOptionsDetector),
            Box::new(StrictTransportSecurityDetector),
            Box::new(FrameProtectionDetector),
            Box::new(ReferrerPolicyDetector),
        ])
    }

    pub fn add_active_detector(&mut self, detector: Box<dyn ActiveDetector>) {
        self.active_detectors.push(detector);
    }

    pub fn analyze(&self, exchange: &HttpExchange) -> Vec<Finding> {
        self.detectors
            .iter()
            .filter_map(|detector| detector.analyze(exchange))
            .collect()
    }

    pub fn analyze_active(&self, exchange: &HttpExchange) -> Vec<Finding> {
        self.active_detectors
            .iter()
            .flat_map(|detector| detector.analyze(exchange))
            .collect()
    }
}

fn response_header<'a>(exchange: &'a HttpExchange, name: &str) -> Option<&'a str> {
    exchange
        .response_headers
        .iter()
        .find(|header| header.name.eq_ignore_ascii_case(name))
        .map(|header| header.value.trim())
}

fn missing_header_finding(
    exchange: &HttpExchange,
    check_id: &str,
    title: &str,
    description: &str,
    severity: Severity,
    header_name: &str,
    hint: &str,
) -> Finding {
    Finding {
        check_id: check_id.to_owned(),
        title: title.to_owned(),
        description: description.to_owned(),
        severity,
        request_id: exchange.request_id.clone(),
        evidence: vec![EvidenceLocation {
            source: EvidenceSource::ResponseHeader,
            header_name: header_name.to_owned(),
            hint: hint.to_owned(),
        }],
    }
}

struct ContentTypeOptionsDetector;

impl PassiveDetector for ContentTypeOptionsDetector {
    fn id(&self) -> &'static str {
        "headers.x_content_type_options"
    }

    fn analyze(&self, exchange: &HttpExchange) -> Option<Finding> {
        let has_nosniff = exchange.response_headers.iter().any(|header| {
            header.name.eq_ignore_ascii_case("x-content-type-options")
                && header.value.trim().eq_ignore_ascii_case("nosniff")
        });

        if has_nosniff {
            return None;
        }

        Some(missing_header_finding(
            exchange,
            self.id(),
            "Missing X-Content-Type-Options",
            "The observed response does not set X-Content-Type-Options to nosniff.",
            Severity::Low,
            "X-Content-Type-Options",
            "Header is absent or does not use the nosniff value",
        ))
    }
}

struct StrictTransportSecurityDetector;

impl PassiveDetector for StrictTransportSecurityDetector {
    fn id(&self) -> &'static str {
        "headers.strict_transport_security"
    }

    fn analyze(&self, exchange: &HttpExchange) -> Option<Finding> {
        if !exchange.url.to_ascii_lowercase().starts_with("https://") {
            return None;
        }

        let has_positive_max_age = response_header(exchange, "strict-transport-security")
            .is_some_and(|value| {
                value.split(';').any(|directive| {
                    directive
                        .trim()
                        .split_once('=')
                        .filter(|(name, _)| name.trim().eq_ignore_ascii_case("max-age"))
                        .and_then(|(_, age)| age.trim().parse::<u64>().ok())
                        .is_some_and(|age| age > 0)
                })
            });

        if has_positive_max_age {
            return None;
        }

        Some(missing_header_finding(
            exchange,
            self.id(),
            "Missing or ineffective Strict-Transport-Security",
            "The observed HTTPS response does not advertise a positive HSTS max-age.",
            Severity::Low,
            "Strict-Transport-Security",
            "Header is absent or has no positive max-age directive",
        ))
    }
}

struct FrameProtectionDetector;

impl PassiveDetector for FrameProtectionDetector {
    fn id(&self) -> &'static str {
        "headers.frame_protection"
    }

    fn analyze(&self, exchange: &HttpExchange) -> Option<Finding> {
        let x_frame_options = response_header(exchange, "x-frame-options");
        let has_x_frame_protection = x_frame_options.is_some_and(|value| {
            value.eq_ignore_ascii_case("deny") || value.eq_ignore_ascii_case("sameorigin")
        });
        let has_csp_frame_ancestors = response_header(exchange, "content-security-policy")
            .is_some_and(|value| {
                value.split(';').any(|directive| {
                    let mut parts = directive.split_ascii_whitespace();
                    parts
                        .next()
                        .is_some_and(|name| name.eq_ignore_ascii_case("frame-ancestors"))
                        && parts.next().is_some()
                })
            });

        if has_x_frame_protection || has_csp_frame_ancestors {
            return None;
        }

        Some(missing_header_finding(
            exchange,
            self.id(),
            "Missing frame protection",
            "The observed response does not set X-Frame-Options or a Content-Security-Policy frame-ancestors directive.",
            Severity::Low,
            "X-Frame-Options",
            "Neither X-Frame-Options nor CSP frame-ancestors was observed",
        ))
    }
}

struct ReferrerPolicyDetector;

impl PassiveDetector for ReferrerPolicyDetector {
    fn id(&self) -> &'static str {
        "headers.referrer_policy"
    }

    fn analyze(&self, exchange: &HttpExchange) -> Option<Finding> {
        if response_header(exchange, "referrer-policy").is_some() {
            return None;
        }

        Some(missing_header_finding(
            exchange,
            self.id(),
            "Missing Referrer-Policy",
            "The observed response does not set a Referrer-Policy header.",
            Severity::Info,
            "Referrer-Policy",
            "Header is absent from the observed response",
        ))
    }
}

// Scope enforcement for active scans

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Scope {
    pub scope_ids: Vec<String>,
}

impl Scope {
    pub fn new(scope_ids: Vec<String>) -> Self {
        Self { scope_ids }
    }

    pub fn is_in_scope(&self, url: &str) -> bool {
        if self.scope_ids.is_empty() {
            return true;
        }
        self.scope_ids.iter().any(|id| url.starts_with(id))
    }
}

// Active detection

pub trait ActiveDetector: Send + Sync {
    fn id(&self) -> &'static str;
    fn metadata(&self) -> CheckMetadata;
    fn analyze(&self, exchange: &HttpExchange) -> Vec<Finding>;
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ActiveScanConfig {
    pub scope: Scope,
    pub request_budget: Option<u64>,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub struct ActiveScanProgress {
    pub exchanges_processed: usize,
    pub exchanges_total: usize,
    pub requests_sent: u64,
    pub request_budget: Option<u64>,
}

pub struct ActiveScanSession {
    id: String,
    config: ActiveScanConfig,
    exchanges: Vec<HttpExchange>,
    next_exchange: usize,
    findings: Vec<Finding>,
    requests_sent: u64,
    state: SessionState,
}

impl ActiveScanSession {
    pub fn new(
        id: impl Into<String>,
        config: ActiveScanConfig,
        exchanges: Vec<HttpExchange>,
    ) -> Self {
        Self {
            id: id.into(),
            config,
            exchanges,
            next_exchange: 0,
            findings: Vec::new(),
            requests_sent: 0,
            state: SessionState::Pending,
        }
    }

    pub fn id(&self) -> &str {
        &self.id
    }

    pub fn state(&self) -> SessionState {
        self.state
    }

    pub fn progress(&self) -> ActiveScanProgress {
        ActiveScanProgress {
            exchanges_processed: self.next_exchange,
            exchanges_total: self.exchanges.len(),
            requests_sent: self.requests_sent,
            request_budget: self.config.request_budget,
        }
    }

    pub fn findings(&self) -> &[Finding] {
        &self.findings
    }

    pub fn start(&mut self) -> bool {
        if self.state != SessionState::Pending {
            return false;
        }

        self.state = SessionState::Running;
        true
    }

    pub fn cancel(&mut self) -> bool {
        if !matches!(self.state, SessionState::Pending | SessionState::Running) {
            return false;
        }

        self.state = SessionState::Cancelled;
        true
    }

    pub fn advance(&mut self, engine: &ScanEngine) -> Result<bool, SessionError> {
        if self.state == SessionState::Pending {
            return Err(SessionError::NotStarted);
        }
        if self.state != SessionState::Running {
            return Ok(false);
        }
        if self.next_exchange == self.exchanges.len() {
            self.state = SessionState::Done;
            return Ok(false);
        }

        if let Some(budget) = self.config.request_budget {
            if self.requests_sent >= budget {
                self.state = SessionState::Done;
                return Ok(false);
            }
        }

        let exchange = &self.exchanges[self.next_exchange];

        if !self.config.scope.is_in_scope(&exchange.url) {
            self.next_exchange += 1;
            if self.next_exchange == self.exchanges.len() {
                self.state = SessionState::Done;
            }
            return Ok(true);
        }

        self.requests_sent += 1;
        self.findings.extend(engine.analyze_active(exchange));
        self.next_exchange += 1;

        if self.next_exchange == self.exchanges.len() {
            self.state = SessionState::Done;
        }
        Ok(true)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use threatmap_detection_api::Header;

    fn exchange(response_headers: Vec<Header>) -> HttpExchange {
        HttpExchange {
            request_id: "req-1".to_owned(),
            method: "GET".to_owned(),
            url: "https://example.test/".to_owned(),
            request_headers: Vec::new(),
            request_body: None,
            response_status: 200,
            response_headers,
            response_body: None,
        }
    }

    #[test]
    fn reports_missing_header_with_request_correlation() {
        let findings = ScanEngine::with_default_detectors().analyze(&exchange(Vec::new()));

        assert!(findings.iter().any(|finding| {
            finding.check_id == "headers.x_content_type_options" && finding.request_id == "req-1"
        }));
    }

    #[test]
    fn header_matching_is_case_insensitive() {
        let findings = ScanEngine::with_default_detectors().analyze(&exchange(vec![Header {
            name: "x-content-type-options".to_owned(),
            value: "NoSnIfF".to_owned(),
        }]));

        assert!(
            !findings
                .iter()
                .any(|finding| finding.check_id == "headers.x_content_type_options")
        );
    }

    #[test]
    fn hsts_is_only_checked_for_https_and_requires_positive_max_age() {
        let engine = ScanEngine::with_default_detectors();
        let http_findings = engine.analyze(&HttpExchange {
            url: "http://example.test/".to_owned(),
            ..exchange(Vec::new())
        });
        let https_findings = engine.analyze(&exchange(Vec::new()));
        let hsts_findings = engine.analyze(&exchange(vec![Header {
            name: "Strict-Transport-Security".to_owned(),
            value: "max-age=0".to_owned(),
        }]));

        assert!(
            !http_findings
                .iter()
                .any(|finding| finding.check_id == "headers.strict_transport_security")
        );
        assert!(
            https_findings
                .iter()
                .any(|finding| finding.check_id == "headers.strict_transport_security")
        );
        assert!(
            hsts_findings
                .iter()
                .any(|finding| finding.check_id == "headers.strict_transport_security")
        );

        let mixed_case_hsts = engine.analyze(&exchange(vec![Header {
            name: "Strict-Transport-Security".to_owned(),
            value: "MAX-AGE=31536000".to_owned(),
        }]));
        assert!(
            !mixed_case_hsts
                .iter()
                .any(|finding| finding.check_id == "headers.strict_transport_security")
        );
    }

    #[test]
    fn csp_frame_ancestors_satisfies_frame_protection_check() {
        let findings = ScanEngine::with_default_detectors().analyze(&exchange(vec![Header {
            name: "Content-Security-Policy".to_owned(),
            value: "default-src 'self'; frame-ancestors 'none'".to_owned(),
        }]));

        assert!(
            !findings
                .iter()
                .any(|finding| finding.check_id == "headers.frame_protection")
        );
    }

    #[test]
    fn malformed_frame_ancestors_directive_does_not_satisfy_protection_check() {
        let findings = ScanEngine::with_default_detectors().analyze(&exchange(vec![Header {
            name: "Content-Security-Policy".to_owned(),
            value: "frame-ancestorsx 'none'; frame-ancestors".to_owned(),
        }]));

        assert!(
            findings
                .iter()
                .any(|finding| finding.check_id == "headers.frame_protection")
        );
    }

    #[test]
    fn x_frame_options_satisfies_frame_protection_check() {
        let findings = ScanEngine::with_default_detectors().analyze(&exchange(vec![Header {
            name: "X-Frame-Options".to_owned(),
            value: "SAMEORIGIN".to_owned(),
        }]));

        assert!(
            !findings
                .iter()
                .any(|finding| finding.check_id == "headers.frame_protection")
        );
    }

    #[test]
    fn session_requires_start_and_tracks_progress_to_completion() {
        let engine = ScanEngine::with_default_detectors();
        let mut session =
            PassiveScanSession::new("scan-1", vec![exchange(Vec::new()), exchange(Vec::new())]);

        assert_eq!(session.advance(&engine), Err(SessionError::NotStarted));
        assert!(session.start());
        assert!(!session.start());
        assert_eq!(session.state(), SessionState::Running);
        assert_eq!(
            session.progress(),
            ScanProgress {
                completed: 0,
                total: 2
            }
        );

        assert!(session.advance(&engine).unwrap());
        assert_eq!(
            session.progress(),
            ScanProgress {
                completed: 1,
                total: 2
            }
        );
        assert_eq!(session.state(), SessionState::Running);

        assert!(session.advance(&engine).unwrap());
        assert_eq!(
            session.progress(),
            ScanProgress {
                completed: 2,
                total: 2
            }
        );
        assert_eq!(session.state(), SessionState::Done);
        assert!(!session.advance(&engine).unwrap());
        assert_eq!(session.id(), "scan-1");
    }

    #[test]
    fn cancellation_stops_before_the_next_exchange() {
        let engine = ScanEngine::with_default_detectors();
        let mut session =
            PassiveScanSession::new("scan-2", vec![exchange(Vec::new()), exchange(Vec::new())]);
        assert!(session.start());
        assert!(session.advance(&engine).unwrap());
        assert!(session.cancel());

        assert_eq!(session.state(), SessionState::Cancelled);
        assert_eq!(
            session.progress(),
            ScanProgress {
                completed: 1,
                total: 2
            }
        );
        assert!(!session.advance(&engine).unwrap());
        assert!(!session.cancel());
    }

    #[test]
    fn empty_session_completes_without_processing_an_exchange() {
        let engine = ScanEngine::with_default_detectors();
        let mut session = PassiveScanSession::new("scan-empty", Vec::new());
        assert!(session.start());

        assert!(!session.advance(&engine).unwrap());
        assert_eq!(session.state(), SessionState::Done);
        assert_eq!(
            session.progress(),
            ScanProgress {
                completed: 0,
                total: 0
            }
        );
    }

    struct StatusCodeDetector;

    impl ActiveDetector for StatusCodeDetector {
        fn id(&self) -> &'static str {
            "active.status_code"
        }

        fn metadata(&self) -> CheckMetadata {
            CheckMetadata {
                id: "active.status_code".to_owned(),
                name: "Unexpected status code".to_owned(),
                description: "Reports non-2xx status codes from active probes.".to_owned(),
                tags: vec!["active".to_owned(), "status".to_owned()],
                aggressivity: threatmap_detection_api::CheckAggressivity {
                    min_requests: 1,
                    max_requests: Some(1),
                },
                check_type: threatmap_detection_api::CheckType::Active,
                severities: vec![Severity::Low],
                depends_on: Vec::new(),
                min_aggressivity: None,
                skip_if_found_by: Vec::new(),
            }
        }

        fn analyze(&self, exchange: &HttpExchange) -> Vec<Finding> {
            if exchange.response_status < 200 || exchange.response_status >= 300 {
                vec![Finding {
                    check_id: self.id().to_owned(),
                    title: "Unexpected status code".to_owned(),
                    description: format!(
                        "Active probe returned status {}",
                        exchange.response_status
                    ),
                    severity: Severity::Low,
                    request_id: exchange.request_id.clone(),
                    evidence: vec![threatmap_detection_api::EvidenceLocation {
                        source: threatmap_detection_api::EvidenceSource::ResponseHeader,
                        header_name: "status".to_owned(),
                        hint: format!("{}", exchange.response_status),
                    }],
                }]
            } else {
                Vec::new()
            }
        }
    }

    #[test]
    fn active_session_requires_start_and_tracks_progress_to_completion() {
        let engine = ScanEngine::with_default_detectors();
        let mut session = ActiveScanSession::new(
            "active-1",
            ActiveScanConfig {
                scope: Scope::new(vec!["https://example.test".to_owned()]),
                request_budget: None,
            },
            vec![exchange(vec![]), exchange(vec![])],
        );

        assert_eq!(session.advance(&engine), Err(SessionError::NotStarted));
        assert!(session.start());
        assert!(!session.start());
        assert_eq!(session.state(), SessionState::Running);

        assert!(session.advance(&engine).unwrap());
        assert_eq!(
            session.progress(),
            ActiveScanProgress {
                exchanges_processed: 1,
                exchanges_total: 2,
                requests_sent: 1,
                request_budget: None,
            }
        );

        assert!(session.advance(&engine).unwrap());
        assert_eq!(session.state(), SessionState::Done);
        assert!(!session.advance(&engine).unwrap());
    }

    #[test]
    fn active_session_skips_out_of_scope_exchanges_without_consuming_budget() {
        let mut engine = ScanEngine::with_default_detectors();
        engine.add_active_detector(Box::new(StatusCodeDetector));
        let mut session = ActiveScanSession::new(
            "active-scope",
            ActiveScanConfig {
                scope: Scope::new(vec!["https://in-scope.test".to_owned()]),
                request_budget: Some(10),
            },
            vec![
                HttpExchange {
                    url: "https://out-of-scope.test/".to_owned(),
                    ..exchange(vec![])
                },
                HttpExchange {
                    url: "https://in-scope.test/".to_owned(),
                    ..exchange(vec![])
                },
            ],
        );

        assert!(session.start());
        assert!(session.advance(&engine).unwrap());
        assert_eq!(session.progress().requests_sent, 0);
        assert_eq!(session.progress().exchanges_processed, 1);

        assert!(session.advance(&engine).unwrap());
        assert_eq!(session.progress().requests_sent, 1);
        assert_eq!(session.progress().exchanges_processed, 2);
        assert_eq!(session.state(), SessionState::Done);
    }

    #[test]
    fn active_session_enforces_request_budget() {
        let mut engine = ScanEngine::with_default_detectors();
        engine.add_active_detector(Box::new(StatusCodeDetector));
        let mut session = ActiveScanSession::new(
            "active-budget",
            ActiveScanConfig {
                scope: Scope::new(vec!["https://example.test".to_owned()]),
                request_budget: Some(1),
            },
            vec![exchange(vec![]), exchange(vec![]), exchange(vec![])],
        );

        assert!(session.start());
        assert!(session.advance(&engine).unwrap());
        assert_eq!(session.progress().requests_sent, 1);
        assert_eq!(session.state(), SessionState::Running);

        assert!(!session.advance(&engine).unwrap());
        assert_eq!(session.state(), SessionState::Done);
        assert_eq!(session.progress().requests_sent, 1);
    }

    #[test]
    fn active_session_cancellation_stops_before_next_exchange() {
        let mut engine = ScanEngine::with_default_detectors();
        engine.add_active_detector(Box::new(StatusCodeDetector));
        let mut session = ActiveScanSession::new(
            "active-cancel",
            ActiveScanConfig {
                scope: Scope::new(vec!["https://example.test".to_owned()]),
                request_budget: None,
            },
            vec![exchange(vec![]), exchange(vec![])],
        );

        assert!(session.start());
        assert!(session.advance(&engine).unwrap());
        assert!(session.cancel());

        assert_eq!(session.state(), SessionState::Cancelled);
        assert!(!session.advance(&engine).unwrap());
        assert!(!session.cancel());
    }

    #[test]
    fn active_session_respects_empty_scope_as_all_in_scope() {
        let engine = ScanEngine::with_default_detectors();
        let mut session = ActiveScanSession::new(
            "active-empty-scope",
            ActiveScanConfig {
                scope: Scope::new(Vec::new()),
                request_budget: None,
            },
            vec![HttpExchange {
                url: "https://anywhere.test/".to_owned(),
                ..exchange(vec![])
            }],
        );

        assert!(session.start());
        assert!(session.advance(&engine).unwrap());
        assert_eq!(session.progress().requests_sent, 1);
        assert_eq!(session.state(), SessionState::Done);
    }
}
