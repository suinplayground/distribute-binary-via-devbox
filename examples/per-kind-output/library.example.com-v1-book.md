# Book

Book represents a book in the library catalog system.

## Overview

The Book resource manages library books with support for: - **Cataloging**: Track book metadata including title, author, and ISBN - **Availability**: Monitor borrowing status and history - **Categorization**: Organize books by multiple categories

### Example

`yaml apiVersion: library.example.com/v1 kind: Book metadata:   name: kubernetes-book spec:   title: "The Kubernetes Book"   author: "Nigel Poulton"   isbn: "978-1-521822-00-8" `

> **Note**: Books marked as `rare` editions have special handling requirements.

- **API version:** `library.example.com/v1`
- **Scope:** Namespaced
- **Plural:** `books`
- **Singular:** `book`
- **Short names:** `bk`

## Quick Reference

| Field path             | Type       | Required | Description                                           |
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
- **Constraints**
  - **Min length:** `1`
  - **Max length:** `200`
- **Example:** `The Kubernetes Book`

### `spec.author`

Author of the book

- **Type:** `string`
- **Required**
- **Constraints**
  - **Min length:** `1`
  - **Max length:** `100`
- **Example:** `Nigel Poulton`

### `spec.isbn`

ISBN-13 of the book

- **Type:** `string`
- **Required**
- **Constraints**
  - **Pattern:**
    ```regex
    ^[0-9]{3}-[0-9]-[0-9]{5}-[0-9]{3}-[0-9]$
    ```
- **Example:** `978-1-521822-00-8`

### `spec.publicationYear`

Year the book was published

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `1450`
  - **Maximum:** `2100`
- **Example:** `2023`

### `spec.publisher`

Publisher of the book

- **Type:** `string`
- **Optional**
- **Example:** `O'Reilly Media`

### `spec.language`

Language of the book

- **Type:** `string`
- **Optional**
- **Constraints**
  - **Allowed values:** `"English"`, `"Spanish"`, `"French"`, `"German"`, `"Japanese"`, `"Chinese"`
- **Default value:** `English`

### `spec.categories`

Categories the book belongs to

- **Type:** `string[]`
- **Optional**
- **Constraints**
  - **Max items:** `5`
  - **Unique items:** Yes

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
- **Constraints**
  - **Minimum:** `0`

### `status.condition`

Physical condition of the book

- **Type:** `string`
- **Optional**
- **Constraints**
  - **Allowed values:** `"New"`, `"Good"`, `"Fair"`, `"Poor"`
