# Database

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

## Quick Reference

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

## Spec

### `spec.engine`

Database engine to use

- **Type:** `string`
- **Required**
- **Constraints**
  - **Immutable** [^immutable_by_CEL_self_==_oldSelf]
  - **Allowed values:** `"postgres"`, `"mysql"`, `"mongodb"`

### `spec.version`

Version of the database engine

- **Type:** `string`
- **Required**
- **Constraints**
  - **Pattern:**
    ```regex
    ^[0-9]+\.[0-9]+(\.[0-9]+)?$
    ```
- **Example:** `"15.4"`

### `spec.storage`

Storage configuration for the database

- **Type:** `object`
- **Required**

### `spec.storage.size`

Storage size (e.g., 10Gi, 100Gi)

- **Type:** `string`
- **Required**
- **Constraints**
  - **Pattern:**
    ```regex
    ^[0-9]+(\.[0-9]+)?(Mi|Gi|Ti)$
    ```
- **Example:** `100Gi`

### `spec.storage.storageClass`

Storage class to use for the volume

- **Type:** `string`
- **Optional**
- **Default value:** `standard`

### `spec.storage.encrypted`

Whether to encrypt storage at rest

- **Type:** `boolean`
- **Optional**
- **Default value:** `true`

### `spec.resources`

Resource requirements for the database

- **Type:** `object`
- **Optional**

### `spec.resources.cpu`

CPU request (e.g., 100m, 2)

- **Type:** `string`
- **Optional**
- **Constraints**
  - **Pattern:**
    ```regex
    ^[0-9]+(\.[0-9]+)?(m)?$
    ```
- **Example:** `"2"`

### `spec.resources.memory`

Memory request (e.g., 512Mi, 4Gi)

- **Type:** `string`
- **Optional**
- **Constraints**
  - **Pattern:**
    ```regex
    ^[0-9]+(\.[0-9]+)?(Mi|Gi)$
    ```
- **Example:** `4Gi`

### `spec.backup`

Backup configuration

- **Type:** `object`
- **Optional**

### `spec.backup.enabled`

Whether automatic backups are enabled

- **Type:** `boolean`
- **Optional**
- **Default value:** `true`

### `spec.backup.schedule`

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

### `spec.backup.retention`

Number of days to retain backups

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `1`
  - **Maximum:** `365`
- **Default value:** `30`

### `spec.connections`

Connection pool configuration

- **Type:** `object`
- **Optional**

### `spec.connections.maxConnections`

Maximum number of connections

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `10`
  - **Maximum:** `1000`
- **Default value:** `100`

### `spec.connections.connectionTimeout`

Connection timeout in seconds

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `1`
  - **Maximum:** `300`
- **Default value:** `30`

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
- **Default value:** `true`

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
- **Example**
  ```yaml
  - 10.0.0.0/8
  - 192.168.1.0/24
  ```

## Status

### `status.phase`

Current phase of the database

- **Type:** `string`
- **Optional**
- **Constraints**
  - **Allowed values:** `"Pending"`, `"Creating"`, `"Running"`, `"Updating"`, `"Failed"`, `"Terminating"`

### `status.endpoint`

Connection endpoint for the database

- **Type:** `string`
- **Optional**
- **Example:** `my-database.default.svc.cluster.local:5432`

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
- **Constraints**
  - **Allowed values:** `"True"`, `"False"`, `"Unknown"`

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
