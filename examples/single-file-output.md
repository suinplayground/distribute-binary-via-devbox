# API Documentation

- [Book](#book)
- [Database](#database)
- [WebApp](#webapp)

## Book

Book represents a book in the library catalog system.

## Overview

The Book resource manages library books with support for:

- **Cataloging**: Track book metadata including title, author, and ISBN
- **Availability**: Monitor borrowing status and history
- **Categorization**: Organize books by multiple categories

### Example

```yaml
apiVersion: library.example.com/v1
kind: Book
metadata:
  name: kubernetes-book
spec:
  title: "The Kubernetes Book"
  author: "Nigel Poulton"
  isbn: "978-1-521822-00-8"
```

> **Note**: Books marked as `rare` editions have special handling requirements.

- **API version:** `library.example.com/v1`
- **Scope:** Namespaced
- **Plural:** `books`
- **Singular:** `book`
- **Short names:** `bk`

### Quick Reference

| Field path             | Type       | Required | Description                                                     |
| ---------------------- | ---------- | -------- | --------------------------------------------------------------- |
| `spec.title`           | `string`   | ✓        | Title of the book                                               |
| `spec.author`          | `string`   | ✓        | Author of the book                                              |
| `spec.isbn`            | `string`   | ✓        | ISBN-13 of the book                                             |
| `spec.publicationYear` | `integer`  |          | Year the book was published                                     |
| `spec.publisher`       | `string`   |          | Publisher of the book                                           |
| `spec.summary`         | `string`   |          | Brief summary of the book's content. This summary should ...    |
| `spec.language`        | `string`   |          | Language of the book                                            |
| `spec.categories`      | `string[]` |          | Categories the book belongs to                                  |
| `spec.edition`         | `object`   |          | Edition information for the book with \*\*special handling\*... |
| `status.available`     | `boolean`  |          | Whether the book is currently available for borrowing           |
| `status.lastBorrowed`  | `string`   |          | Last time the book was borrowed                                 |
| `status.totalBorrows`  | `integer`  |          | Total number of times the book has been borrowed                |
| `status.condition`     | `string`   |          | Physical condition of the book                                  |

Note: This table shows fields up to 2 levels deep. Deeper nested fields are documented in the sections below.

### Spec

#### `spec.title`

Title of the book

- **Type:** `string`
- **Required**
- **Constraints**
  - **Min length:** `1`
  - **Max length:** `200`
- **Example:** `The Kubernetes Book`

#### `spec.author`

Author of the book

- **Type:** `string`
- **Required**
- **Constraints**
  - **Min length:** `1`
  - **Max length:** `100`
- **Example:** `Nigel Poulton`

#### `spec.isbn`

ISBN-13 of the book

- **Type:** `string`
- **Required**
- **Constraints**
  - **Pattern:**
    ```regex
    ^[0-9]{3}-[0-9]-[0-9]{5}-[0-9]{3}-[0-9]$
    ```
- **Example:** `978-1-521822-00-8`

#### `spec.publicationYear`

Year the book was published

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `1450`
  - **Maximum:** `2100`
- **Example:** `2023`

#### `spec.publisher`

Publisher of the book

- **Type:** `string`
- **Optional**
- **Example:** `O'Reilly Media`

#### `spec.summary`

Brief summary of the book's content. This summary should capture the main themes,
topics, and key takeaways from the book. It helps readers quickly understand what
the book is about before deciding whether to borrow or purchase it for reading.

- **Type:** `string`
- **Optional**
- **Constraints**
  - **Max length:** `1000`
- **Example:** `A comprehensive guide to Kubernetes that covers core concepts, architecture, and practical deployment strategies.`

#### `spec.language`

Language of the book

- **Type:** `string`
- **Optional**
- **Constraints**
  - **Allowed values:** `"English"`, `"Spanish"`, `"French"`, `"German"`, `"Japanese"`, `"Chinese"`
- **Default value:** `English`

#### `spec.categories`

Categories the book belongs to

- **Type:** `string[]`
- **Optional**
- **Constraints**
  - **Max items:** `5`
  - **Unique items:** Yes

#### `spec.edition`

Edition information for the book with **special handling** for rare editions.

## Edition Types

- `first` - First edition (most valuable)
- `revised` - Revised edition with updates
- `anniversary` - Special anniversary edition
- `collector` - Limited collector's edition

### Handling Requirements

| Edition Type  | Storage            | Lending    | Insurance    |
| ------------- | ------------------ | ---------- | ------------ |
| `first`       | Climate-controlled | Restricted | Required     |
| `collector`   | Climate-controlled | No         | Required     |
| `anniversary` | Standard           | Yes        | Optional     |
| `revised`     | Standard           | Yes        | Not required |

> **Warning**: First editions and collector's editions require approval from the head librarian before any lending.

For more information, see our [rare books policy](https://library.example.com/policies/rare-books).

- **Type:** `object`
- **Optional**

#### `spec.edition.type`

Type of edition

- **Type:** `string`
- **Optional**
- **Constraints**
  - **Allowed values:** `"first"`, `"revised"`, `"anniversary"`, `"collector"`, `"standard"`
- **Default value:** `standard`

#### `spec.edition.year`

Year this edition was published

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `1450`
  - **Maximum:** `2100`

#### `spec.edition.printRun`

Number of copies in this print run (for limited editions)

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `1`

#### `spec.edition.specialNotes`

Any special notes about this edition

- **Type:** `string`
- **Optional**
- **Constraints**
  - **Max length:** `500`

### Status

#### `status.available`

Whether the book is currently available for borrowing

- **Type:** `boolean`
- **Optional**

#### `status.lastBorrowed`

Last time the book was borrowed

- **Type:** `string` (`date-time`)
- **Optional**

#### `status.totalBorrows`

Total number of times the book has been borrowed

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `0`

#### `status.condition`

Physical condition of the book

- **Type:** `string`
- **Optional**
- **Constraints**
  - **Allowed values:** `"New"`, `"Good"`, `"Fair"`, `"Poor"`

## Database

Database represents a **managed database instance** with automated backups and high availability.

## Supported Engines

| Engine     | Versions   | Features                            |
| ---------- | ---------- | ----------------------------------- |
| PostgreSQL | 13, 14, 15 | Full SQL support, JSONB, Extensions |
| MySQL      | 5.7, 8.0   | InnoDB, Replication                 |

### Important Configuration

1. **Storage**: Always use SSD-backed storage classes for production
2. **Backups**: Enable automated backups with at least 7-day retention
3. **Security**: Configure TLS and restrict access via `allowedIPs`

For detailed configuration examples, see the [Database Guide](https://docs.example.com/databases).

***

⚠️ **Warning**: Changing the `engine` or `version` after creation will result in data loss.

- **API version:** `data.example.com/v1beta1`
- **Scope:** Namespaced
- **Plural:** `databases`
- **Singular:** `database`
- **Short names:** `db`

### Quick Reference

| Field path          | Type       | Required | Description                                         |
| ------------------- | ---------- | -------- | --------------------------------------------------- |
| `spec.engine`       | `string`   | ✓        | Database engine to use                              |
| `spec.version`      | `string`   | ✓        | Version of the database engine                      |
| `spec.storage`      | `object`   | ✓        | Storage configuration for the database              |
| `spec.resources`    | `object`   |          | Resource requirements for the database              |
| `spec.backup`       | `object`   |          | Backup configuration                                |
| `spec.connections`  | `object`   |          | Connection pool configuration                       |
| `spec.security`     | `object`   |          | Security configuration                              |
| `status.phase`      | `string`   |          | Current phase of the database                       |
| `status.endpoint`   | `string`   |          | Connection endpoint for the database                |
| `status.ready`      | `boolean`  |          | Whether the database is ready to accept connections |
| `status.lastBackup` | `string`   |          | Timestamp of the last successful backup             |
| `status.conditions` | `object[]` |          | Current conditions of the database                  |

Note: This table shows fields up to 2 levels deep. Deeper nested fields are documented in the sections below.

### Spec

#### `spec.engine`

Database engine to use

- **Type:** `string`
- **Required**
- **Constraints**
  - **Immutable** [^immutable_by_CEL_self_==_oldSelf]
  - **Allowed values:** `"postgres"`, `"mysql"`, `"mongodb"`

#### `spec.version`

Version of the database engine

- **Type:** `string`
- **Required**
- **Constraints**
  - **Pattern:**
    ```regex
    ^[0-9]+\.[0-9]+(\.[0-9]+)?$
    ```
- **Example:** `"15.4"`

#### `spec.storage`

Storage configuration for the database

- **Type:** `object`
- **Required**

#### `spec.storage.size`

Storage size (e.g., 10Gi, 100Gi)

- **Type:** `string`
- **Required**
- **Constraints**
  - **Pattern:**
    ```regex
    ^[0-9]+(\.[0-9]+)?(Mi|Gi|Ti)$
    ```
- **Example:** `100Gi`

#### `spec.storage.storageClass`

Storage class to use for the volume

- **Type:** `string`
- **Optional**
- **Default value:** `standard`

#### `spec.storage.encrypted`

Whether to encrypt storage at rest

- **Type:** `boolean`
- **Optional**
- **Default value:** `true`

#### `spec.resources`

Resource requirements for the database

- **Type:** `object`
- **Optional**

#### `spec.resources.cpu`

CPU request (e.g., 100m, 2)

- **Type:** `string`
- **Optional**
- **Constraints**
  - **Pattern:**
    ```regex
    ^[0-9]+(\.[0-9]+)?(m)?$
    ```
- **Example:** `"2"`

#### `spec.resources.memory`

Memory request (e.g., 512Mi, 4Gi)

- **Type:** `string`
- **Optional**
- **Constraints**
  - **Pattern:**
    ```regex
    ^[0-9]+(\.[0-9]+)?(Mi|Gi)$
    ```
- **Example:** `4Gi`

#### `spec.backup`

Backup configuration

- **Type:** `object`
- **Optional**

#### `spec.backup.enabled`

Whether automatic backups are enabled

- **Type:** `boolean`
- **Optional**
- **Default value:** `true`

#### `spec.backup.schedule`

Cron schedule for backups

- **Type:** `string`
- **Optional**
- **Constraints**
  - **Pattern:**
    ```regex
    ^(@(annually|yearly|monthly|weekly|daily|hourly))|(((\*|\?|[0-9]|[0-5][0-9])(/[0-9]+)?|(\*|[0-9]|[0-5][0-9])-([0-9]|[0-5][0-9]))(\s+|$)){5}$
    ```
- **Default value:** `0 2 * * *`
- **Example:** `0 2 * * *`

#### `spec.backup.retention`

Number of days to retain backups

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `1`
  - **Maximum:** `365`
- **Default value:** `30`

#### `spec.connections`

Connection pool configuration

- **Type:** `object`
- **Optional**

#### `spec.connections.maxConnections`

Maximum number of connections

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `10`
  - **Maximum:** `1000`
- **Default value:** `100`

#### `spec.connections.connectionTimeout`

Connection timeout in seconds

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `1`
  - **Maximum:** `300`
- **Default value:** `30`

#### `spec.security`

Security configuration

- **Type:** `object`
- **Optional**

#### `spec.security.tls`

TLS configuration

- **Type:** `object`
- **Optional**

#### `spec.security.tls.enabled`

Whether TLS is enabled

- **Type:** `boolean`
- **Optional**
- **Default value:** `true`

#### `spec.security.tls.certificateSecretRef`

Reference to a secret containing TLS certificates

- **Type:** `object`
- **Optional**

#### `spec.security.tls.certificateSecretRef.name`

Name of the secret

- **Type:** `string`
- **Required**

#### `spec.security.tls.certificateSecretRef.namespace`

Namespace of the secret (defaults to same namespace)

- **Type:** `string`
- **Optional**

#### `spec.security.allowedIPRanges`

IP ranges allowed to connect

- **Type:** `string[]`
- **Optional**
- **Example**
  ```yaml
  - 10.0.0.0/8
  - 192.168.1.0/24
  ```

### Status

#### `status.phase`

Current phase of the database

- **Type:** `string`
- **Optional**
- **Constraints**
  - **Allowed values:** `"Pending"`, `"Creating"`, `"Running"`, `"Updating"`, `"Failed"`, `"Terminating"`

#### `status.endpoint`

Connection endpoint for the database

- **Type:** `string`
- **Optional**
- **Example:** `my-database.default.svc.cluster.local:5432`

#### `status.ready`

Whether the database is ready to accept connections

- **Type:** `boolean`
- **Optional**

#### `status.lastBackup`

Timestamp of the last successful backup

- **Type:** `string` (`date-time`)
- **Optional**

#### `status.conditions`

Current conditions of the database

- **Type:** `object[]`
- **Optional**

#### `status.conditions.type`

Type of condition

- **Type:** `string`
- **Required**

#### `status.conditions.status`

Status of the condition

- **Type:** `string`
- **Required**
- **Constraints**
  - **Allowed values:** `"True"`, `"False"`, `"Unknown"`

#### `status.conditions.lastTransitionTime`

Last time the condition transitioned

- **Type:** `string` (`date-time`)
- **Optional**

#### `status.conditions.reason`

Reason for the condition's last transition

- **Type:** `string`
- **Optional**

#### `status.conditions.message`

Human-readable message

- **Type:** `string`
- **Optional**

## WebApp

WebApp represents a web application deployment

- **API version:** `apps.example.com/v2`
- **Scope:** Namespaced
- **Plural:** `webapps`
- **Singular:** `webapp`

### Quick Reference

| Field path                  | Type       | Required | Description                              |
| --------------------------- | ---------- | -------- | ---------------------------------------- |
| `spec.image`                | `string`   | ✓        | Container image for the web application  |
| `spec.replicas`             | `integer`  | ✓        | Number of replicas to run                |
| `spec.port`                 | `integer`  |          | Port the application listens on          |
| `spec.env`                  | `object[]` |          | Environment variables to set             |
| `spec.healthCheck`          | `object`   |          | Health check configuration               |
| `spec.autoscaling`          | `object`   |          | Autoscaling configuration                |
| `spec.ingress`              | `object`   |          | Ingress configuration                    |
| `status.availableReplicas`  | `integer`  |          | Number of available replicas             |
| `status.url`                | `string`   |          | URL where the application is accessible  |
| `status.lastDeploymentTime` | `string`   |          | Time of the last deployment              |
| `status.currentVersion`     | `string`   |          | Currently deployed version               |
| `status.healthStatus`       | `string`   |          | Overall health status of the application |

Note: This table shows fields up to 2 levels deep. Deeper nested fields are documented in the sections below.

### Spec

#### `spec.image`

Container image for the web application

- **Type:** `string`
- **Required**
- **Constraints**
  - **Pattern:**
    ```regex
    ^[a-z0-9]+([\._-][a-z0-9]+)*(/[a-z0-9]+([\._-][a-z0-9]+)*)*(:[\.\w][\w\.-]{0,127})?(@sha256:[a-fA-F0-9]{64})?$
    ```
- **Example:** `myapp:v1.2.3`

#### `spec.replicas`

Number of replicas to run

- **Type:** `integer`
- **Required**
- **Constraints**
  - **Minimum:** `1`
  - **Maximum:** `100`
  - **Validation:** Replicas must be at least 1
    ```cel
    self >= 1
    ```
- **Default value:** `3`

#### `spec.port`

Port the application listens on

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `1`
  - **Maximum:** `65535`
- **Default value:** `8080`

#### `spec.env`

Environment variables to set

- **Type:** `object[]`
- **Optional**
- **Constraints**
  - **Max items:** `50`

#### `spec.env.name`

Name of the environment variable

- **Type:** `string`
- **Required**
- **Constraints**
  - **Pattern:**
    ```regex
    ^[A-Z_][A-Z0-9_]*$
    ```

#### `spec.env.value`

Value of the environment variable

- **Type:** `string`
- **Required**

#### `spec.healthCheck`

Health check configuration

- **Type:** `object`
- **Optional**

#### `spec.healthCheck.path`

HTTP path for health checks

- **Type:** `string`
- **Optional**
- **Default value:** `/health`

#### `spec.healthCheck.intervalSeconds`

Interval between health checks

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `5`
  - **Maximum:** `300`
- **Default value:** `30`

#### `spec.healthCheck.timeoutSeconds`

Timeout for health checks

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `1`
  - **Maximum:** `60`
- **Default value:** `10`

#### `spec.autoscaling`

Autoscaling configuration

- **Type:** `object`
- **Optional**
- **Constraints**
  - **Validation:** minReplicas must be less than or equal to maxReplicas
    ```cel
    !self.enabled || self.minReplicas <= self.maxReplicas
    ```

#### `spec.autoscaling.enabled`

Whether autoscaling is enabled

- **Type:** `boolean`
- **Optional**
- **Default value:** `false`

#### `spec.autoscaling.minReplicas`

Minimum number of replicas

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `1`
- **Default value:** `2`

#### `spec.autoscaling.maxReplicas`

Maximum number of replicas

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `1`
  - **Maximum:** `1000`
- **Default value:** `10`

#### `spec.autoscaling.targetCPUUtilization`

Target CPU utilization percentage

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `1`
  - **Maximum:** `100`
- **Default value:** `80`

#### `spec.ingress`

Ingress configuration

- **Type:** `object`
- **Optional**

#### `spec.ingress.enabled`

Whether to create an ingress

- **Type:** `boolean`
- **Optional**
- **Default value:** `true`

#### `spec.ingress.hostname`

Hostname for the ingress

- **Type:** `string`
- **Optional**
- **Constraints**
  - **Pattern:**
    ```regex
    ^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$
    ```
- **Example:** `myapp.example.com`

#### `spec.ingress.tls`

Whether to enable TLS

- **Type:** `boolean`
- **Optional**
- **Default value:** `true`

#### `spec.ingress.annotations`

Annotations to add to the ingress

- **Type:** `object`
- **Optional**

### Status

#### `status.availableReplicas`

Number of available replicas

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `0`

#### `status.url`

URL where the application is accessible

- **Type:** `string`
- **Optional**
- **Example:** `https://myapp.example.com`

#### `status.lastDeploymentTime`

Time of the last deployment

- **Type:** `string` (`date-time`)
- **Optional**

#### `status.currentVersion`

Currently deployed version

- **Type:** `string`
- **Optional**

#### `status.healthStatus`

Overall health status of the application

- **Type:** `string`
- **Optional**
- **Constraints**
  - **Allowed values:** `"Healthy"`, `"Degraded"`, `"Unhealthy"`, `"Unknown"`

[^immutable_by_CEL_self_==_oldSelf]: This field is immutable. Once set, it cannot be modified as enforced by the CEL validation rule: `self == oldSelf`
