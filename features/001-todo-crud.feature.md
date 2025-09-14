# Feature: TODO CRUD Operations

ID: 001
As a: user of the public API
I want to: create, read, update, partially update and delete TODO items
So that: I can manage my task list lifecycle

---

## Scenario: List existing TODO items
Given the system has zero or more existing TODO items
When I send a GET request to `/api/todos`
Then the response status should be 200
And the body should be a JSON array

Test file: `tests/api/todos-production.spec.js`
Test name: `GET /api/todos - should return list of todos`

## Scenario: Create a new TODO item
Given I have a valid JSON payload with a non-empty string `text`
When I send a POST request to `/api/todos`
Then the response status should be 201
And the body should contain a new TODO with properties `uuid`, `text`, `completed: false`, `createdAt`, `updatedAt`

Test file: `tests/api/todos-production.spec.js`
Test name: `POST /api/todos - should create a new todo`

## Scenario: Retrieve a TODO item by UUID
Given an existing TODO item
When I send a GET request to `/api/todos/:uuid`
Then the response status should be 200
And the body should contain the TODO item with the requested `uuid`

Test file: `tests/api/todos-production.spec.js`
Test name: `GET /api/todos/:uuid - should get specific todo`

## Scenario: Update a TODO item fully
Given an existing TODO item
When I send a PUT request to `/api/todos/:uuid` with a new valid `text` and `completed: true`
Then the response status should be 200
And the body should reflect the updated fields

Test file: `tests/api/todos-production.spec.js`
Test name: `PUT /api/todos/:uuid - should update todo`

## Scenario: Delete a TODO item
Given an existing TODO item
When I send a DELETE request to `/api/todos/:uuid`
Then the response status should be 204
And a subsequent GET to the same UUID should return 404

Test file: `tests/api/todos-production.spec.js`
Test name: `DELETE /api/todos/:uuid - should delete todo`

## Scenario: Retrieve non-existent TODO returns 404
Given a UUID that does not correspond to any existing TODO
When I send a GET request to `/api/todos/:uuid`
Then the response status should be 404

Test file: `tests/api/todos-production.spec.js`
Test name: `GET /api/todos/:uuid - should return 404 for non-existent todo`

## Scenario: Validate required fields on create
Given a POST request payload missing the `text` field
When I send the request to `/api/todos`
Then the response status should be 400

Test file: `tests/api/todos-production.spec.js`
Test name: `POST /api/todos - should validate required fields`

## Scenario: Validate text field type on create
Given a POST request payload where `text` is not a string
When I send the request to `/api/todos`
Then the response status should be 400

Test file: `tests/api/todos-production.spec.js`
Test name: `POST /api/todos - should validate text field type`

## Scenario: Update non-existent TODO returns 404
Given a UUID that does not correspond to any existing TODO
When I send a PUT request to `/api/todos/:uuid`
Then the response status should be 404

Test file: `tests/api/todos-production.spec.js`
Test name: `PUT /api/todos/:uuid - should return 404 for non-existent todo`

## Scenario: Delete non-existent TODO returns 404
Given a UUID that does not correspond to any existing TODO
When I send a DELETE request to `/api/todos/:uuid`
Then the response status should be 404

Test file: `tests/api/todos-production.spec.js`
Test name: `DELETE /api/todos/:uuid - should return 404 for non-existent todo`
