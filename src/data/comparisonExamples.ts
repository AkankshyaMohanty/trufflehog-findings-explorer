import type { RawTruffleHogFinding } from "../types";

export const comparisonBaseline: RawTruffleHogFinding[] = [
  {
    "DetectorName": "AWS",
    "Verified": false,
    "Redacted": "AKIA****************",
    "Raw": "AKIAREGRESSION123",
    "SourceMetadata": {
      "Data": {
        "Git": {
          "repository": "demo-backup-service",
          "file": ".env",
          "branch": "main",
          "commit": "111aaaa",
          "timestamp": "2026-08-10T08:00:00Z"
        }
      }
    }
  },
  {
    "DetectorName": "Slack",
    "Verified": false,
    "Redacted": "xoxb-****************",
    "Raw": "xoxb-recurring-example",
    "SourceMetadata": {
      "Data": {
        "Git": {
          "repository": "notification-service",
          "file": "config/default.json",
          "branch": "develop",
          "commit": "222bbbb",
          "timestamp": "2026-08-10T08:05:00Z"
        }
      }
    }
  },
  {
    "DetectorName": "Github",
    "Verified": true,
    "Redacted": "ghp_****************",
    "Raw": "ghp_resolved_example",
    "SourceMetadata": {
      "Data": {
        "Git": {
          "repository": "infra-tools",
          "file": "scripts/bootstrap.sh",
          "branch": "main",
          "commit": "333cccc",
          "timestamp": "2026-08-10T08:10:00Z"
        }
      }
    }
  }
];

export const comparisonCurrent: RawTruffleHogFinding[] = [
  {
    "DetectorName": "AWS",
    "Verified": true,
    "Redacted": "AKIA****************",
    "Raw": "AKIAREGRESSION123",
    "SourceMetadata": {
      "Data": {
        "Git": {
          "repository": "demo-backup-service",
          "file": ".env",
          "branch": "main",
          "commit": "444dddd",
          "timestamp": "2026-08-16T08:00:00Z"
        }
      }
    }
  },
  {
    "DetectorName": "Slack",
    "Verified": false,
    "Redacted": "xoxb-****************",
    "Raw": "xoxb-recurring-example",
    "SourceMetadata": {
      "Data": {
        "Git": {
          "repository": "notification-service",
          "file": "config/default.json",
          "branch": "develop",
          "commit": "555eeee",
          "timestamp": "2026-08-16T08:05:00Z"
        }
      }
    }
  },
  {
    "DetectorName": "GCP",
    "Verified": false,
    "Redacted": "{ \"type\": \"service_account\", ... }",
    "Raw": "service-account-new-example",
    "SourceMetadata": {
      "Data": {
        "Git": {
          "repository": "data-pipeline",
          "file": "service-account.json",
          "branch": "main",
          "commit": "666ffff",
          "timestamp": "2026-08-16T08:10:00Z"
        }
      }
    }
  }
];
