# API Documentation

- [Book](#book)
- [Database](#database)
- [WebApp](#webapp)

## Book

Book represents a book in the library catalog

- **API Version:** `library.example.com/v1`
- **Scope:** Namespaced
- **Plural:** `books`
- **Singular:** `book`
- **Short Names:** `bk`

### Quick Reference

| Field Path             | Type       | Required | Description                                           |
| ---------------------- | ---------- | -------- | ----------------------------------------------------- |
| `spec.title`           | `string`   | ✓        | Title of the book                                     |
| `spec.author`          | `string`   | ✓        | Author of the book                                    |
| `spec.isbn`            | `string`   | ✓        | ISBN-13 of the book                                   |
| `spec.publicationYear` | `integer`  |          | Year the book was published                           |
| `spec.publisher`       | `string`   |          | Publisher of the book                                 |
| `spec.language`        | `string`   |          | Language of the book                                  |
| `spec.categories`      | `string[]` |          | Categories the book belongs to                        |
| `status.available`     | `boolean`  |          | Whether the book is currently available for borrowing |
| `status.lastBorrowed`  | `string`   |          | Last time the book was borrowed                       |
| `status.totalBorrows`  | `integer`  |          | Total number of times the book has been borrowed      |
| `status.condition`     | `string`   |          | Physical condition of the book                        |

### Spec

#### `spec.title`

Title of the book

- **Type:** `string`
- **Required**

**Constraints**

- **Min Length:** `1`
- **Max Length:** `200`

**Example**

```yaml
The Kubernetes Book
```

#### `spec.author`

Author of the book

- **Type:** `string`
- **Required**

**Constraints**

- **Min Length:** `1`
- **Max Length:** `100`

**Example**

```yaml
Nigel Poulton
```

#### `spec.isbn`

ISBN-13 of the book

- **Type:** `string`
- **Required**

**Constraints**

- **Pattern:**&#x20;

  ```regex
  ^[0-9]{3}-[0-9]-[0-9]{5}-[0-9]{3}-[0-9]$
  ```

**Example**

```yaml
978-1-521822-00-8
```

#### `spec.publicationYear`

Year the book was published

- **Type:** `integer`
- **Optional**

**Constraints**

- **Minimum:** `1450`
- **Maximum:** `2100`

**Example**

```yaml
2023
```

#### `spec.publisher`

Publisher of the book

- **Type:** `string`
- **Optional**

**Example**

```yaml
O'Reilly Media
```

#### `spec.language`

Language of the book

- **Type:** `string`
- **Optional**
- **Default:** `"English"`

**Constraints**

- **Allowed Values:** `"English"`, `"Spanish"`, `"French"`, `"German"`, `"Japanese"`, `"Chinese"`

#### `spec.categories`

Categories the book belongs to

- **Type:** `string[]`
- **Optional**

**Constraints**

- **Max Items:** `5`
- **Unique Items:** Yes

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

**Constraints**

- **Minimum:** `0`

#### `status.condition`

Physical condition of the book

- **Type:** `string`
- **Optional**

**Constraints**

- **Allowed Values:** `"New"`, `"Good"`, `"Fair"`, `"Poor"`

## Database

Database represents a managed database instance

- **API Version:** `data.example.com/v1beta1`
- **Scope:** Namespaced
- **Plural:** `databases`
- **Singular:** `database`
- **Short Names:** `db`

### Quick Reference

| Field Path          | Type       | Required | Description                                         |
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

**Constraints**

- **Immutable** [^immutable_by_CEL_self_==_oldSelf]
- **Allowed Values:** `"postgres"`, `"mysql"`, `"mongodb"`

#### `spec.version`

Version of the database engine

- **Type:** `string`
- **Required**

**Constraints**

- **Pattern:**&#x20;

  ```regex
  ^[0-9]+\.[0-9]+(\.[0-9]+)?$
  ```

**Example**

```yaml
"15.4"
```

#### `spec.storage`

Storage configuration for the database

- **Type:** `object`
- **Required**

#### `spec.storage.size`

Storage size (e.g., 10Gi, 100Gi)

- **Type:** `string`
- **Required**

**Constraints**

- **Pattern:**&#x20;

  ```regex
  ^[0-9]+(\.[0-9]+)?(Mi|Gi|Ti)$
  ```

**Example**

```yaml
100Gi
```

#### `spec.storage.storageClass`

Storage class to use for the volume

- **Type:** `string`
- **Optional**
- **Default:** `"standard"`

#### `spec.storage.encrypted`

Whether to encrypt storage at rest

- **Type:** `boolean`
- **Optional**
- **Default:** `true`

#### `spec.resources`

Resource requirements for the database

- **Type:** `object`
- **Optional**

#### `spec.resources.cpu`

CPU request (e.g., 100m, 2)

- **Type:** `string`
- **Optional**

**Constraints**

- **Pattern:**&#x20;

  ```regex
  ^[0-9]+(\.[0-9]+)?(m)?$
  ```

**Example**

```yaml
"2"
```

#### `spec.resources.memory`

Memory request (e.g., 512Mi, 4Gi)

- **Type:** `string`
- **Optional**

**Constraints**

- **Pattern:**&#x20;

  ```regex
  ^[0-9]+(\.[0-9]+)?(Mi|Gi)$
  ```

**Example**

```yaml
4Gi
```

#### `spec.backup`

Backup configuration

- **Type:** `object`
- **Optional**

#### `spec.backup.enabled`

Whether automatic backups are enabled

- **Type:** `boolean`
- **Optional**
- **Default:** `true`

#### `spec.backup.schedule`

Cron schedule for backups

- **Type:** `string`
- **Optional**
- **Default:** `"0 2 * * *"`

**Constraints**

- **Pattern:**&#x20;

  ```regex
  ^(@(annually|yearly|monthly|weekly|daily|hourly))|(((\*|\?|[0-9]|[0-5][0-9])(/[0-9]+)?|(\*|[0-9]|[0-5][0-9])-([0-9]|[0-5][0-9]))(\s+|$)){5}$
  ```

**Example**

```yaml
0 2 * * *
```

#### `spec.backup.retention`

Number of days to retain backups

- **Type:** `integer`
- **Optional**
- **Default:** `30`

**Constraints**

- **Minimum:** `1`
- **Maximum:** `365`

#### `spec.connections`

Connection pool configuration

- **Type:** `object`
- **Optional**

#### `spec.connections.maxConnections`

Maximum number of connections

- **Type:** `integer`
- **Optional**
- **Default:** `100`

**Constraints**

- **Minimum:** `10`
- **Maximum:** `1000`

#### `spec.connections.connectionTimeout`

Connection timeout in seconds

- **Type:** `integer`
- **Optional**
- **Default:** `30`

**Constraints**

- **Minimum:** `1`
- **Maximum:** `300`

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
- **Default:** `true`

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

**Example**

```yaml
- 10.0.0.0/8
- 192.168.1.0/24
```

### Status

#### `status.phase`

Current phase of the database

- **Type:** `string`
- **Optional**

**Constraints**

- **Allowed Values:** `"Pending"`, `"Creating"`, `"Running"`, `"Updating"`, `"Failed"`, `"Terminating"`

#### `status.endpoint`

Connection endpoint for the database

- **Type:** `string`
- **Optional**

**Example**

```yaml
my-database.default.svc.cluster.local:5432
```

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

**Constraints**

- **Allowed Values:** `"True"`, `"False"`, `"Unknown"`

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

- **API Version:** `apps.example.com/v2`
- **Scope:** Namespaced
- **Plural:** `webapps`
- **Singular:** `webapp`

### Quick Reference

| Field Path                  | Type       | Required | Description                              |
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

**Constraints**

- **Pattern:**&#x20;

  ```regex
  ^[a-z0-9]+([\._-][a-z0-9]+)*(/[a-z0-9]+([\._-][a-z0-9]+)*)*(:[\.\w][\w\.-]{0,127})?(@sha256:[a-fA-F0-9]{64})?$
  ```

**Example**

```yaml
myapp:v1.2.3
```

#### `spec.replicas`

Number of replicas to run

- **Type:** `integer`
- **Required**
- **Default:** `3`

**Constraints**

- **Minimum:** `1`
- **Maximum:** `100`
- **Validation:** Replicas must be at least 1

  ```cel
  self >= 1
  ```

#### `spec.port`

Port the application listens on

- **Type:** `integer`
- **Optional**
- **Default:** `8080`

**Constraints**

- **Minimum:** `1`
- **Maximum:** `65535`

#### `spec.env`

Environment variables to set

- **Type:** `object[]`
- **Optional**

**Constraints**

- **Max Items:** `50`

#### `spec.env.name`

Name of the environment variable

- **Type:** `string`
- **Required**

**Constraints**

- **Pattern:**&#x20;

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
- **Default:** `"/health"`

#### `spec.healthCheck.intervalSeconds`

Interval between health checks

- **Type:** `integer`
- **Optional**
- **Default:** `30`

**Constraints**

- **Minimum:** `5`
- **Maximum:** `300`

#### `spec.healthCheck.timeoutSeconds`

Timeout for health checks

- **Type:** `integer`
- **Optional**
- **Default:** `10`

**Constraints**

- **Minimum:** `1`
- **Maximum:** `60`

#### `spec.autoscaling`

Autoscaling configuration

- **Type:** `object`
- **Optional**

**Constraints**

- **Validation:** minReplicas must be less than or equal to maxReplicas

  ```cel
  !self.enabled || self.minReplicas <= self.maxReplicas
  ```

#### `spec.autoscaling.enabled`

Whether autoscaling is enabled

- **Type:** `boolean`
- **Optional**
- **Default:** `false`

#### `spec.autoscaling.minReplicas`

Minimum number of replicas

- **Type:** `integer`
- **Optional**
- **Default:** `2`

**Constraints**

- **Minimum:** `1`

#### `spec.autoscaling.maxReplicas`

Maximum number of replicas

- **Type:** `integer`
- **Optional**
- **Default:** `10`

**Constraints**

- **Minimum:** `1`
- **Maximum:** `1000`

#### `spec.autoscaling.targetCPUUtilization`

Target CPU utilization percentage

- **Type:** `integer`
- **Optional**
- **Default:** `80`

**Constraints**

- **Minimum:** `1`
- **Maximum:** `100`

#### `spec.ingress`

Ingress configuration

- **Type:** `object`
- **Optional**

#### `spec.ingress.enabled`

Whether to create an ingress

- **Type:** `boolean`
- **Optional**
- **Default:** `true`

#### `spec.ingress.hostname`

Hostname for the ingress

- **Type:** `string`
- **Optional**

**Constraints**

- **Pattern:**&#x20;

  ```regex
  ^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$
  ```

**Example**

```yaml
myapp.example.com
```

#### `spec.ingress.tls`

Whether to enable TLS

- **Type:** `boolean`
- **Optional**
- **Default:** `true`

#### `spec.ingress.annotations`

Annotations to add to the ingress

- **Type:** `object`
- **Optional**

### Status

#### `status.availableReplicas`

Number of available replicas

- **Type:** `integer`
- **Optional**

**Constraints**

- **Minimum:** `0`

#### `status.url`

URL where the application is accessible

- **Type:** `string`
- **Optional**

**Example**

```yaml
https://myapp.example.com
```

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

**Constraints**

- **Allowed Values:** `"Healthy"`, `"Degraded"`, `"Unhealthy"`, `"Unknown"`

[^immutable_by_CEL_self_==_oldSelf]: This field is immutable. Once set, it cannot be modified as enforced by the CEL validation rule: `self == oldSelf`
