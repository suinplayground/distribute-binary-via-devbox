# WebApp

WebApp represents a web application deployment

- **API version:** `apps.example.com/v2`
- **Scope:** Namespaced
- **Plural:** `webapps`
- **Singular:** `webapp`

## Quick Reference

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

## Spec

### `spec.image`

Container image for the web application

- **Type:** `string`
- **Required**
- **Constraints**
  - **Pattern:**
    ```regex
    ^[a-z0-9]+([\._-][a-z0-9]+)*(/[a-z0-9]+([\._-][a-z0-9]+)*)*(:[\.\w][\w\.-]{0,127})?(@sha256:[a-fA-F0-9]{64})?$
    ```
- **Example:** `myapp:v1.2.3`

### `spec.replicas`

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

### `spec.port`

Port the application listens on

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `1`
  - **Maximum:** `65535`
- **Default value:** `8080`

### `spec.env`

Environment variables to set

- **Type:** `object[]`
- **Optional**
- **Constraints**
  - **Max items:** `50`

### `spec.env.name`

Name of the environment variable

- **Type:** `string`
- **Required**
- **Constraints**
  - **Pattern:**
    ```regex
    ^[A-Z_][A-Z0-9_]*$
    ```

### `spec.env.value`

Value of the environment variable

- **Type:** `string`
- **Required**

### `spec.healthCheck`

Health check configuration

- **Type:** `object`
- **Optional**

### `spec.healthCheck.path`

HTTP path for health checks

- **Type:** `string`
- **Optional**
- **Default value:** `/health`

### `spec.healthCheck.intervalSeconds`

Interval between health checks

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `5`
  - **Maximum:** `300`
- **Default value:** `30`

### `spec.healthCheck.timeoutSeconds`

Timeout for health checks

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `1`
  - **Maximum:** `60`
- **Default value:** `10`

### `spec.autoscaling`

Autoscaling configuration

- **Type:** `object`
- **Optional**
- **Constraints**
  - **Validation:** minReplicas must be less than or equal to maxReplicas
    ```cel
    !self.enabled || self.minReplicas <= self.maxReplicas
    ```

### `spec.autoscaling.enabled`

Whether autoscaling is enabled

- **Type:** `boolean`
- **Optional**
- **Default value:** `false`

### `spec.autoscaling.minReplicas`

Minimum number of replicas

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `1`
- **Default value:** `2`

### `spec.autoscaling.maxReplicas`

Maximum number of replicas

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `1`
  - **Maximum:** `1000`
- **Default value:** `10`

### `spec.autoscaling.targetCPUUtilization`

Target CPU utilization percentage

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `1`
  - **Maximum:** `100`
- **Default value:** `80`

### `spec.ingress`

Ingress configuration

- **Type:** `object`
- **Optional**

### `spec.ingress.enabled`

Whether to create an ingress

- **Type:** `boolean`
- **Optional**
- **Default value:** `true`

### `spec.ingress.hostname`

Hostname for the ingress

- **Type:** `string`
- **Optional**
- **Constraints**
  - **Pattern:**
    ```regex
    ^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$
    ```
- **Example:** `myapp.example.com`

### `spec.ingress.tls`

Whether to enable TLS

- **Type:** `boolean`
- **Optional**
- **Default value:** `true`

### `spec.ingress.annotations`

Annotations to add to the ingress

- **Type:** `object`
- **Optional**

## Status

### `status.availableReplicas`

Number of available replicas

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `0`

### `status.url`

URL where the application is accessible

- **Type:** `string`
- **Optional**
- **Example:** `https://myapp.example.com`

### `status.lastDeploymentTime`

Time of the last deployment

- **Type:** `string` (`date-time`)
- **Optional**

### `status.currentVersion`

Currently deployed version

- **Type:** `string`
- **Optional**

### `status.healthStatus`

Overall health status of the application

- **Type:** `string`
- **Optional**
- **Constraints**
  - **Allowed values:** `"Healthy"`, `"Degraded"`, `"Unhealthy"`, `"Unknown"`
