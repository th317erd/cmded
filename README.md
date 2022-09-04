# cmded

CMDed is a command line argument parser made for humans.

CMDed makes it easy to build CLI tools, or any command that needs arguments. Unlike other command argument parsers, CMDed aims at keeping the interface straight forward and simple, while also remaining very simple (and small) in nature.

The core concept that makes CMDed works is "consuming" arguments combined with argument "scanning".

Any arguments that are validly parsed against a matching pattern are "consumed". Being consumed, they are then ignored by further processing. This makes parsing complex combinations straight forward and simple.

Take for example the following command:

`./my-echo hello world --use-system-echo --duplicate`

All arguments are scanned (in the order you specify) and marked as "consumed". So, when specifying the "boolean" arguments `--use-system-echo` and `--duplicate` in our code first, the arguments would be scanned, and the "boolean" arguments would be marked as "consumed" (visualized with `.....`):

`./my-echo hello world ................. ...........`

Now, inside your argument "context" there are the values `{ 'useEcho': true, 'duplicate': true }`, and then the remaining arguments are up for parsing next. This makes it straight forward for the parser to figure out what is going on, even if the argument order is changed. For example, if we place the "boolean" flags first, nothing changes:

`./my-echo --duplicate --use-system-echo hello world`

...when looking at the consumed arguments:

`./my-echo ........... ................. hello world`

In this case, we want all remaining arguments to be echoed to the user. CMDed has a special context property named `_remaining` which are all remaining "unconsumed" arguments after parsing has completed.

With all of this in mind, we can create the above example using CMDed:

```javascript
```