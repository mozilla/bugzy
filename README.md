Warning, this code is pretty quick and dirty. Use at your own risk.

### To run:

```
npm install
npm start
```

## Note about queries:

Use `runQuery` in `content/lib/utils.js` to get data from bugzilla. The API is pretty similar to the regular
Bugzilla REST API:

```js
// Example
runQuery({
  // Look at include_fields in schema/query_options.js for a list of possible options
  include_fields: ["id", "summary", "cf_fx_iteration"],

  // Anything in builtin_filters in schema/query_options.js is allowed at the top level.
  // You can use an Array for multiple values
  component: ["Activity Stream: General", "Activity Stream: New Tab"],

  // This is a special utility added in for your convenience
  iteration: "60.1"

  // Other filters (see custom_filters in schema/query_options.js) must be added to the "custom" field
  custom: {
    // This corresponds to f1=cf_fx_iteration&o1=substring&v1=60.1
    cf_fx_iteration: "60.1",

    // This corresponds to f2=dependson&o2=anywordssubstr&v2=12345,67890
    dependson: [12345, 67890],

    // This corresponds to f3=assigned_to&o3=exactly&v3=foo@goo.com
    assigned_to: {exactly: "foo@goo.com"}
  }
});
