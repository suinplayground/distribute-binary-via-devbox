# Book

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

## Quick Reference

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

### `spec.summary`

Brief summary of the book's content. This summary should capture the main themes,
topics, and key takeaways from the book. It helps readers quickly understand what
the book is about before deciding whether to borrow or purchase it for reading.

- **Type:** `string`
- **Optional**
- **Constraints**
  - **Max length:** `1000`
- **Example:** `A comprehensive guide to Kubernetes that covers core concepts, architecture, and practical deployment strategies.`

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

### `spec.edition`

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

### `spec.edition.type`

Type of edition

- **Type:** `string`
- **Optional**
- **Constraints**
  - **Allowed values:** `"first"`, `"revised"`, `"anniversary"`, `"collector"`, `"standard"`
- **Default value:** `standard`

### `spec.edition.year`

Year this edition was published

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `1450`
  - **Maximum:** `2100`

### `spec.edition.printRun`

Number of copies in this print run (for limited editions)

- **Type:** `integer`
- **Optional**
- **Constraints**
  - **Minimum:** `1`

### `spec.edition.specialNotes`

Any special notes about this edition

- **Type:** `string`
- **Optional**
- **Constraints**
  - **Max length:** `500`

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
