# Database

Database represents a managed database instance

- **API Version:** `data.example.com/v1beta1`
- **Scope:** Namespaced
- **Plural:** `databases`
- **Singular:** `database`
- **Short Names:** `db`

## Quick Reference

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

## Spec

### `spec.engine`

Database engine to use

- **Type:** `string`
- **Required**

**Constraints**

- **Immutable** [^immutable_by_CEL_self_==_oldSelf]
- **Allowed Values:** `"postgres"`, `"mysql"`, `"mongodb"`

### `spec.version`

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

### `spec.storage`

Storage configuration for the database

- **Type:** `object`
- **Required**

### `spec.storage.size`

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

### `spec.storage.storageClass`

Storage class to use for the volume

- **Type:** `string`
- **Optional**
- **Default:** `"standard"`

### `spec.storage.encrypted`

Whether to encrypt storage at rest

- **Type:** `boolean`
- **Optional**
- **Default:** `true`

### `spec.resources`

Resource requirements for the database

- **Type:** `object`
- **Optional**

### `spec.resources.cpu`

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

### `spec.resources.memory`

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

### `spec.backup`

Backup configuration

- **Type:** `object`
- **Optional**

### `spec.backup.enabled`

Whether automatic backups are enabled

- **Type:** `boolean`
- **Optional**
- **Default:** `true`

### `spec.backup.schedule`

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

### `spec.backup.retention`

Number of days to retain backups

- **Type:** `integer`
- **Optional**
- **Default:** `30`

**Constraints**

- **Minimum:** `1`
- **Maximum:** `365`

### `spec.connections`

Connection pool configuration

- **Type:** `object`
- **Optional**

### `spec.connections.maxConnections`

Maximum number of connections

- **Type:** `integer`
- **Optional**
- **Default:** `100`

**Constraints**

- **Minimum:** `10`
- **Maximum:** `1000`

### `spec.connections.connectionTimeout`

Connection timeout in seconds

- **Type:** `integer`
- **Optional**
- **Default:** `30`

**Constraints**

- **Minimum:** `1`
- **Maximum:** `300`

### `spec.security`

Security configuration

- **Type:** `object`
- **Optional**

### `spec.security.tls`

TLS configuration

- **Type:** `object`
- **Optional**

### `spec.security.tls.enabled`

Whether TLS is enabled

- **Type:** `boolean`
- **Optional**
- **Default:** `true`

### `spec.security.tls.certificateSecretRef`

Reference to a secret containing TLS certificates

- **Type:** `object`
- **Optional**

### `spec.security.tls.certificateSecretRef.name`

Name of the secret

- **Type:** `string`
- **Required**

### `spec.security.tls.certificateSecretRef.namespace`

Namespace of the secret (defaults to same namespace)

- **Type:** `string`
- **Optional**

### `spec.security.allowedIPRanges`

IP ranges allowed to connect

- **Type:** `string[]`
- **Optional**

**Example**

```yaml
- 10.0.0.0/8
- 192.168.1.0/24
```

## Status

### `status.phase`

Current phase of the database

- **Type:** `string`
- **Optional**

**Constraints**

- **Allowed Values:** `"Pending"`, `"Creating"`, `"Running"`, `"Updating"`, `"Failed"`, `"Terminating"`

### `status.endpoint`

Connection endpoint for the database

- **Type:** `string`
- **Optional**

**Example**

```yaml
my-database.default.svc.cluster.local:5432
```

### `status.ready`

Whether the database is ready to accept connections

- **Type:** `boolean`
- **Optional**

### `status.lastBackup`

Timestamp of the last successful backup

- **Type:** `string` (`date-time`)
- **Optional**

### `status.conditions`

Current conditions of the database

- **Type:** `object[]`
- **Optional**

### `status.conditions.type`

Type of condition

- **Type:** `string`
- **Required**

### `status.conditions.status`

Status of the condition

- **Type:** `string`
- **Required**

**Constraints**

- **Allowed Values:** `"True"`, `"False"`, `"Unknown"`

### `status.conditions.lastTransitionTime`

Last time the condition transitioned

- **Type:** `string` (`date-time`)
- **Optional**

### `status.conditions.reason`

Reason for the condition's last transition

- **Type:** `string`
- **Optional**

### `status.conditions.message`

Human-readable message

- **Type:** `string`
- **Optional**

[^immutable_by_CEL_self_==_oldSelf]: This field is immutable. Once set, it cannot be modified as enforced by the CEL validation rule: `self == oldSelf`
