

<p align="center">
  <a href="https://taqueria.io">
    <img alt="Taqueria" src="https://user-images.githubusercontent.com/1114943/150659418-e55f1df3-ba4d-4e05-ab26-1f729858c7fb.png" width="" />
  </a>
</p>
<h1 align="center">
  Taqueria - A New Way to Build on Tezos
</h1>

> WARNING: This project has not officially been made public. Congratulations on finding it. Have a look around, but be aware, it's not yet ready for public consumption.! CLIs and APIs are unstable and likely to change.

## What is Taqueria?

Taqueria is an extensible, open source plugin based framework for Tezos dApp development

In more practical terms, Taqueria is a task runner that you can use from the command line or the VS Code command palette to quickly accomplish tasks related to Tezos development. Taqueria uses a plugin architecture to implement tasks that provide complex and domain specific functionality

Taqueria includes:

- A command line interface (CLI) you use in your terminal through a command named `taq`
- A library of plugins that add tasks to Taqueria
- A VS Code Extension which provides the ability to run Taqueria tasks from the command palette

## Installing the Taqueria CLI

The Taqueria CLI is an executable binary named `taq` installed globally in your shell's `$PATH`

1. Download the correct build of Taqueria for your operating system
2. Make the Taqueria binary `taq` executable
3. Add `taq` to your shell's `$PATH`

Builds for the latest release of Taqueria:
| OS      | URL                                     |  
|---------|-----------------------------------------|
| MacOS   | https://taqueria.io/get/macos/taq       |
| Linux   | https://taqueria.io/get/linux/taq       |
| Windows | https://taqueria.io/get/windows/taq.exe |

Builds are also available on the [releases](https://github.com/ecadlabs/taqueria/releases) page on Github

> Detailed instructions for installing and using Taqueria can be found [here](https://taqueria.io/docs/getting-started/installation)

## Getting Started

>**How to verify that taq is installed properly?**
>You can run `which taq` to verify that the taq binary can be found (via your PATH env variable). You can also run `taq --version` to verify which version you are running. If you downloaded a precompiled binary from our website, then the version # should be displayed. If you built taq from sources, then the version should display `dev-[branchName]`, such as `dev-main`.

Once installed, Taqueria is run from the command line using the `taq` command. The basic structure of a Taqueria command is:
```shell
taq <taskName> [options]
```

You can use `taq --help` to list the available tasks in a given context
![taq help output](/website/static/img/taq-help-cli.png)

### Plugins

Taqueria plugins extend the functionality of Taqueria by adding additional tasks that can be run on a project. Currently available plugins are:
| name         |  pluginName                       |  description                                                |
|--------------|------------------------------     |-------------------------------------------------------------|
| Core         | `@taqueria/plugin-core`           | Contains core utility tasks provided by Taqueria            |
| LIGO         | `@taqueria/plugin-ligo`           | A compiler for the LIGO smart contract language             |
| SmartPy      | `@taqueria/plugin-smartpy`        | A compiler for the SmartPy contract language                |
| Flextesa     | `@taqueria/plugin-flextesa`       | A sandbox test network running Tezos Flextesa               | 
| Taquito      | `@taqueria/plugin-taquito`        | A front-end Tezos framework used to originate               |
| TS Generator | `@taqueria/plugin-contract-types` | A type generator that produces TS types from Michelson code |
| Tezos Client | `@taqueria/plugin-tezos-client`   | A Tezos client that can be used to interact with the network|

Taqueria manages plugins by providing installation/uninstallation via the `taq install <pluginName>` and `taq uninstall <pluginName>` tasks. Plugins are installed on a per-project basis during which the NPM package is downloaded and installed on the project, and configuration is added in the `./.taq/config.json` file

### Creating a Taqueria Project

There are two approaches to initializing a Taqueria project: initializing an empty project, or using a pre-configured project scaffold

#### Initializing an empty Taqueria project
1. Initialize a new project: `taq init test-project`
2. Change directories: `cd test-project`
3. Install the LIGO plugin: `taq install @taqueria/plugin-ligo`
4. Continue steps 4-5 for each additional plugin you want to install

#### Using a Taqueria Project Scaffold
1. Run the command `taq scaffold`
2. Change directories: `cd test-project`
3. Run the project setup command `npm run setup`
4. Start the app by running `npm run start`

### Building From Source

If you prefer to build the Taqueria binary and plugins locally, follow the steps detailed below

#### Requirements

- [Deno](https://deno.land/) v1.23.4
- [NodeJS](https://nodejs.org/en/) v16.16.0 or later
- [Docker](https://www.docker.com/) v0.9 or later

#### Run Build Script
From the root of the Taqueria directory, run the build-all script:
```shell
npm run build-all
```

## Test

## Usage:
Since the taqueria project is currently making use of NPM workspaces all activity is generally going to take place in the root (taqueria) directory. Commands will not function normally if run from the tests directory and the following commands will be what you can use to install all dependencies and run the tests for taqueria:
### Installation
- From the taqueria root directory (eg. `~/taqueria`) installing the dependencies for the project can be accomplished with the normal `npm install`. By default `npm install` will install everything, if you're making changes and want to check something out then the targeted NPM install will be handy
- If you're going to be running the unit tests you need to make sure that deno is installed on your system. Installation instructions can be found [here](https://deno.land/manual@v1.18.2/getting_started/installation)
- Installing specific plugins/tools needed for testing can be accomplished with the workspace modified NPM install: `npm install -w {workspace_name}` defined in the project top level package.json file (make sure to check this is the case before doing anything). For the tests directory the workspace has been defined as `tests` so the command will be `npm install -w tests`.
- This will put all dependencies in the project level `node_modules/` folder so the test code will need to be searching for dependencies there. This is covered in the `tsconfig.test.json` file which points to the node modules folder a level up from the tests folder like so:
```
    "typeRoots": ["../node_modules/@types"],
    "types": ["node", "jest", "ts-jest"]
```

- An example combining the above
```
$ npm install
$ npm install -w taqueria-plugin-ligo
$ npm install -w taqueria-plugin-mock
$ npm install -w tests
```

### Running the Tests:
- The tests should be run from the taqueria root folder by calling the test run script with the workspace specified: `npm run test:{unit|integration|e2e} -w tests`
    - If you're going to be running the unit tests then you will need deno installed on your system