export type ConnectedMessage = {
  kind: "connected";
  packageId: string;
  downloadUrl: string;
};

export type RebuildMessage = {
  kind: "rebuild";
  downloadUrl: string;
};

export type ErrorMessage = {
  kind: "error";
  error: string;
};
