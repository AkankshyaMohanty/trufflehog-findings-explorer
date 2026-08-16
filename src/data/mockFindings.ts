import type { RawTruffleHogFinding } from "../types";

export const mockFindings: RawTruffleHogFinding[] = [
  {
    DetectorName: "AWS",
    Verified: true,
    Redacted: "AKIA****************",
    Raw: "AKIAEXAMPLE123456",
    SourceMetadata: {
      Data: {
        Git: {
          repository: "UnifiedBackup",
          file: ".env",
          branch: "main",
          commit: "a1b2c3d",
          timestamp: "2026-08-15T08:10:00Z"
        }
      }
    }
  },
  {
    DetectorName: "AWS",
    Verified: true,
    Redacted: "AKIA****************",
    Raw: "AKIAEXAMPLE123456",
    SourceMetadata: {
      Data: {
        Git: {
          repository: "UnifiedBackup",
          file: "cleanup.js",
          branch: "main",
          commit: "c4d5e6f",
          timestamp: "2026-08-15T09:40:00Z"
        }
      }
    }
  },
  {
    DetectorName: "GCP",
    Verified: false,
    Redacted: "{ \"type\": \"service_account\", ... }",
    Raw: "service-account-example",
    SourceMetadata: {
      Data: {
        Git: {
          repository: "DAL-TeamLambda",
          file: "accountkey.json",
          branch: "prod",
          commit: "beef123",
          timestamp: "2026-08-14T11:00:00Z"
        }
      }
    }
  },
  {
    DetectorName: "HubSpotApiKey",
    Verified: false,
    Redacted: "5a4cc20b-72ab-4d61-88d2-5b34a4a77e3b",
    Raw: "5a4cc20b-72ab-4d61-88d2-5b34a4a77e3b",
    SourceMetadata: {
      Data: {
        CloudWatch: {
          logGroup: "/aws/lambda/backup-worker",
          logStream: "2026/08/15/[$LATEST]demo"
        }
      }
    }
  },
  {
    DetectorName: "HubSpotApiKey",
    Verified: false,
    Redacted: "8df316ca-d1d8-4c9f-87ae-e0bc119dd71f",
    Raw: "8df316ca-d1d8-4c9f-87ae-e0bc119dd71f",
    SourceMetadata: {
      Data: {
        CloudWatch: {
          logGroup: "/aws/lambda/backup-worker",
          logStream: "2026/08/15/[$LATEST]demo-2"
        }
      }
    }
  },
  {
    DetectorName: "Github",
    Verified: true,
    Redacted: "ghp_****************",
    Raw: "ghp_example_token_12345",
    SourceMetadata: {
      Data: {
        Git: {
          repository: "infra-tools",
          file: "scripts/bootstrap.sh",
          branch: "main",
          commit: "9ac31ef",
          timestamp: "2026-08-13T06:30:00Z"
        }
      }
    }
  },
  {
    DetectorName: "Slack",
    Verified: false,
    Redacted: "xoxb-****************",
    Raw: "xoxb-example-token",
    SourceMetadata: {
      Data: {
        Git: {
          repository: "notification-service",
          file: "config/default.json",
          branch: "develop",
          commit: "11aa22b",
          timestamp: "2026-08-12T13:00:00Z"
        }
      }
    }
  },
  {
    DetectorName: "AWS",
    Verified: false,
    Redacted: "AKIA****************",
    Raw: "AKIAUNVERIFIED999",
    SourceMetadata: {
      Data: {
        S3: {
          bucket: "security-scan-demo",
          key: "reports/sample.txt"
        }
      }
    }
  }
];
