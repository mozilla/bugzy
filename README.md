Bugzy is a dashboard for tracking specific Bugzilla bugs. It's designed to be
used by teams that want to track bugs in a specific iteration, or bugs that are
blocking a specific bug.

## To run:

```
npm install
npm start
```

## To deploy:

[Follow these instructions.](docs/deploy.md)

## Notes:

Bugzy looks for a Bugzilla API key in the `BUGZY_BZ_API_KEY` environment
variable. A key isn't necessary for it to function, but rate limits are more
forgiving with a key. You can get one for testing
[here](https://bugzilla.mozilla.org/userprefs.cgi?tab=apikey).

⚠ _**Warning:**_ If you use an API key, be sure to store it securely as an
environment variable. Do not write it directly into the code, to ensure you
don't accidentally commit it to source control. This goes for both Bugzilla API
keys (which are already used) and keys for any other APIs you might add.

Use `runQuery` in `content/lib/utils.js` to get data from bugzilla. The API is
pretty similar to the regular Bugzilla REST API:

```js
// Example:
runQuery({
  // Look at include_fields in schema/query_options.js for a list of options.
  include_fields: ["id", "summary", "cf_fx_iteration"],

  // Anything in builtin_filters in schema/query_options.js is allowed at the
  // top level. You can use an Array for multiple values.
  component: ["Activity Stream: General", "Activity Stream: New Tab"],

  // This is a special utility added in for your convenience
  iteration: "60.1",

  // Other filters (see custom_filters in schema/query_options.js) must be added
  // to the "custom" field...
  custom: {
    // This corresponds to f1=cf_fx_iteration&o1=substring&v1=60.1
    cf_fx_iteration: "60.1",

    // This corresponds to f2=dependson&o2=anywordssubstr&v2=12345,67890
    dependson: [12345, 67890],

    // This corresponds to f3=assigned_to&o3=exactly&v3=foo@goo.com
    assigned_to: { exactly: "foo@goo.com" },
  },

  // or the "rules" field. You cannot use both custom and rules at the same
  // time. The following are equivalent to the above "custom" example:
  rules: [
    {
      field: "cf_fx_iteration",
      operator: "substring",
      value: "60.1",
    },
    {
      field: "dependson",
      operator: "anywordssubstr",
      value: [12345, 67890],
    },
    {
      field: "assigned_to",
      operator: "exactly",
      value: "foo@goo.com",
    },
  ],
});

// More complex queries may require the OR group operator. This operator
// requires the more verbose "rules" field instead of the "custom" field.
runQuery({
  include_fields: ["id", "summary", "cf_fx_iteration"],
  rules: [
    // This corresponds to f1=bug_type&o1=equals&v1=defect
    { key: "bug_type", operator: "equals", value: "defect" },

    // This group corresponds to f2=OP&j2=OR&f3=OP&f4=product&o4=equals&v4=Firefox&f5=component&o5=equals&v5=Stuff&f6=CP&f7=OP&f8=keywords&o8=nowordssubstr&v8=meta&f9=blocked&o9=equals&v9=12345&f10=CP&f11=CP
    // It returns bugs in Firefox::Stuff plus non-meta bugs blocking bug 12345.

    // A group will not work if it's the first element in the rules array, so
    // always start with a regular rule before any groups.
    {
      // j2=OR
      operator: "OR",
      // f2=OP
      rules: [
        {
          // f3=OP
          // An omitted operator for a group defaults to "AND" so there's no j3.
          rules: [
            // f4=product&o4=equals&v4=Firefox
            { key: "product", operator: "equals", value: "Firefox" },
            // f5=component&o5=equals&v5=Stuff
            { key: "component", operator: "equals", value: "Stuff" },
          ],
          // f6=CP
        },
        {
          // f7=OP
          rules: [
            // f8=keywords&o8=nowordssubstr&v8=meta
            { key: "keywords", operator: "nowordssubstr", value: "meta" },
            // f9=blocked&o9=equals&v9=12345
            { key: "blocked", operator: "equals", value: 12345 },
          ],
          // f10=CP
        },
      ],
      // f11=CP
    },
  ],
});
```
