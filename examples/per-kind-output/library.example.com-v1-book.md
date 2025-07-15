# Book

Book represents a book in the library catalog

- **API Version:** `library.example.com/v1`
- **Scope:** Namespaced
- **Plural:** `books`
- **Singular:** `book`
- **Short Names:** `bk`

## Quick Reference

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

## Spec

### `spec.title`

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

### `spec.author`

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

### `spec.isbn`

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

### `spec.publicationYear`

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

### `spec.publisher`

Publisher of the book

- **Type:** `string`
- **Optional**

**Example**

```yaml
O'Reilly Media
```

### `spec.language`

Language of the book

- **Type:** `string`
- **Optional**
- **Default:** `"English"`

**Constraints**

- **Allowed Values:** `"English"`, `"Spanish"`, `"French"`, `"German"`, `"Japanese"`, `"Chinese"`

### `spec.categories`

Categories the book belongs to

- **Type:** `string[]`
- **Optional**

**Constraints**

- **Max Items:** `5`
- **Unique Items:** Yes

## Status

### `status.available`

Whether the book is currently available for borrowing

- **Type:** `boolean`
- **Optional**

### `status.lastBorrowed`

Last time the book was borrowed

- **Type:** `string` (`date-time`)
- **Optional**

### `status.totalBorrows`

Total number of times the book has been borrowed

- **Type:** `integer`
- **Optional**

**Constraints**

- **Minimum:** `0`

### `status.condition`

Physical condition of the book

- **Type:** `string`
- **Optional**

**Constraints**

- **Allowed Values:** `"New"`, `"Good"`, `"Fair"`, `"Poor"`
