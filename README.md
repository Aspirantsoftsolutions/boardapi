# StreamBoard Backend built on Nodejs, Express, MongoDB

The backend for StreamBoard and Administration

## Getting started


This is a basic API skeleton written in JavaScript ES2015. Very useful to building a RESTful web APIs for your front-end platforms like Android, iOS or JavaScript frameworks (Angular, Reactjs, etc).

This project will run on **NodeJs** using **MongoDB** as database. I had tried to maintain the code structure easy as any beginner can also adopt the flow and start building an API. Project is open for suggestions, Bug reports and pull requests.

## Features

-   Basic Authentication (Register/Login with hashed password)
-   Account confirmation with 4 (Changeable) digit OTP.
-   Email helper ready just import and use.
-   JWT Tokens, make requests with a token after login with `Authorization` header with value `Bearer yourToken` where `yourToken` will be returned in Login response.
-   Pre-defined response structures with proper status codes.
-   Included CORS.
-   Validations added.
-   Test cases with [Mocha](https://mochajs.org/) and [Chai](https://www.chaijs.com/).
-   Code coverage with [Istanbuljs (nyc)](https://istanbul.js.org/).
-   Included CI (Continuous Integration) with [Travis CI](https://travis-ci.org) and [Gitlab CI/CD](https://gitlab.com).
-   Linting with [Eslint](https://eslint.org/).

## Software Requirements

-   Node.js **8+**
-   MongoDB **3.6+** (Recommended **4+**)

## How to install

### Using Git (recommended)

1.  Clone the project from github. Change "myproject" to your project name.

```bash
git clone https://github.com/Aspirantsoftsolutions/boardapi.git ./myproject
```

### Using manual download ZIP

1.  Download repository
2.  Uncompress to your desired directory

### Install npm dependencies after installing (Git or manual download)

```bash
cd myproject
npm install
```

### Setting up environments

1.  You will find a file named `.env.example` on root directory of project.
2.  Create a new file by copying and pasting the file and then renaming it to just `.env`
    ```bash
    cp .env.example .env
    ```
3.  The file `.env` is already ignored, so you never commit your credentials.
4.  Change the values of the file to your environment. Helpful comments added to `.env.example` file to understand the constants.
## Project  structure
```sh

## How to run

### Running  API server locally

```bash
npm run dev
```

You will know server is running by checking the output of the command `npm run dev`

```bash
Connected to mongodb:YOUR_DB_CONNECTION_STRING
App is running ...

Press CTRL + C to stop the process.
```
**Note:**  `YOUR_DB_CONNECTION_STRING` will be your MongoDB connection string.

## Tests

### Running  Test Cases

```bash
npm test
```

You can set custom command for test at `package.json` file inside `scripts` property. You can also change timeout for each assertion with `--timeout` parameter of mocha command.

### Creating new tests

If you need to add more test cases to the project just create a new file in `/test/` and run the command.

## ESLint

### Running  Eslint

```bash
npm run lint
```

You can set custom rules for eslint in `.eslintrc.json` file, Added at project root.

## Bugs or improvements

Every project needs improvements, Feel free to report any bugs or improvements. Pull requests are always welcome.

## License