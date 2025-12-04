## After-School Lessons – Backend ##
Node/Express + MongoDB backend for the coursework.

## Main Routes ##

- GET /lessons – returns all lessons
- GET /search – full-text search over subject, location, price, spaces
- POST /orders – saves an order
- PUT /lessons/:id – updates lesson attributes (used to update spaces)
- Generic REST routes: /collection/:collectionName ...

Includes:
- Logger middleware for all requests
- Static image middleware under /images
