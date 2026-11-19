use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct Header {
    pub name: String,
    pub value: String,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct HttpExchange {
    pub request_id: String,
    pub method: String,
    pub url: String,
    pub request_headers: Vec<Header>,
    pub request_body: Option<Vec<u8>>,
    pub response_status: u16,
    pub response_headers: Vec<Header>,
    pub response_body: Option<Vec<u8>>,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum CheckType {
    Passive,
    Active,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Aggressivity {
    Low,
    Medium,
    High,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct CheckAggressivity {
    pub min_requests: u64,
    pub max_requests: Option<u64>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct CheckMetadata {
    pub id: String,
    pub name: String,
    pub description: String,
    pub tags: Vec<String>,
    pub aggressivity: CheckAggressivity,
    pub check_type: CheckType,
    pub severities: Vec<Severity>,
    pub depends_on: Vec<String>,
    pub min_aggressivity: Option<Aggressivity>,
    pub skip_if_found_by: Vec<String>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum Severity {
    Info,
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct EvidenceLocation {
    pub source: EvidenceSource,
    pub header_name: String,
    pub hint: String,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum EvidenceSource {
    RequestHeader,
    ResponseHeader,
    RequestBody,
    ResponseBody,
    Url,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct Finding {
    pub check_id: String,
    pub title: String,
    pub description: String,
    pub severity: Severity,
    pub request_id: String,
    pub evidence: Vec<EvidenceLocation>,
}

#[cfg(test)]
fn test_exchange() -> HttpExchange {
    HttpExchange {
        request_id: "req-1".to_owned(),
        method: "GET".to_owned(),
        url: "https://example.test/".to_owned(),
        request_headers: Vec::new(),
        request_body: None,
        response_status: 200,
        response_headers: Vec::new(),
        response_body: None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn finding_json_is_stable_and_correlated() {
        let finding = Finding {
            check_id: "headers.x_content_type_options".to_owned(),
            title: "Missing X-Content-Type-Options".to_owned(),
            description: "The response does not set X-Content-Type-Options to nosniff.".to_owned(),
            severity: Severity::Low,
            request_id: "req-1".to_owned(),
            evidence: vec![EvidenceLocation {
                source: EvidenceSource::ResponseHeader,
                header_name: "X-Content-Type-Options".to_owned(),
                hint: "Header is absent".to_owned(),
            }],
        };

        let json = serde_json::to_value(finding).expect("finding serializes");
        assert_eq!(json["severity"], "low");
        assert_eq!(json["request_id"], "req-1");
        assert_eq!(json["evidence"][0]["source"], "response_header");
    }

    #[test]
    fn exchange_serializes_with_optional_bodies() {
        let exchange = test_exchange();
        let json = serde_json::to_value(exchange).expect("exchange serializes");
        assert_eq!(json["request_id"], "req-1");
        assert_eq!(json["request_body"], serde_json::Value::Null);
        assert_eq!(json["response_body"], serde_json::Value::Null);
    }

    #[test]
    fn check_metadata_serializes_stably() {
        let metadata = CheckMetadata {
            id: "headers.x_content_type_options".to_owned(),
            name: "Missing X-Content-Type-Options".to_owned(),
            description: "The response does not set X-Content-Type-Options to nosniff.".to_owned(),
            tags: vec!["headers".to_owned(), "x-content-type-options".to_owned()],
            aggressivity: CheckAggressivity {
                min_requests: 0,
                max_requests: None,
            },
            check_type: CheckType::Passive,
            severities: vec![Severity::Low],
            depends_on: Vec::new(),
            min_aggressivity: None,
            skip_if_found_by: Vec::new(),
        };

        let json = serde_json::to_value(metadata).expect("metadata serializes");
        assert_eq!(json["id"], "headers.x_content_type_options");
        assert_eq!(json["check_type"], "passive");
        assert_eq!(json["aggressivity"]["min_requests"], 0);
        assert_eq!(
            json["aggressivity"]["max_requests"],
            serde_json::Value::Null
        );
    }
}
