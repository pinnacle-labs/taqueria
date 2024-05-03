

<p align="center">
  <a href="https://taqueria.io">
    <img alt="Taqueria" src="https://user-images.githubusercontent.com/1114943/150659418-e55f1df3-ba4d-4e05-ab26-1f729858c7fb.png" width="" />
  </a>
</p>
<h1 align="center">
  Taqueria - A New Way to Build on Tezos
</h1>

## What is Taqueria?

Taqueria is an extensible, open source plugin based framework for Tezos dApp development

In more practical terms, Taqueria is a task runner that you can use from the command line or the VS Code command palette to quickly accomplish tasks related to Tezos development. Taqueria uses a plugin architecture to implement tasks that provide complex and domain specific functionality

Taqueria includes:

- A command line interface (CLI) you use in your terminal through a command named `taq`
- A library of plugins that add tasks and other functionality to Taqueria
- A VS Code Extension which provides the ability to run Taqueria tasks from the command palette

## Installing the Taqueria CLI

The Taqueria CLI is an executable binary named `taq` installed globally in your shell's `$PATH`

Run the following in your terminal:
```
/bin/bash -c "$(wget -O - https://taqueria.io/install-taq.sh 2>/dev/null || curl -fsSL https://taqueria.io/install-taq.sh)"
```

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
| Archetype    | `@taqueria/plugin-archetype`      | A compiler for the Archetype smart contract language        |
| Core         | `@taqueria/plugin-core`           | Contains core utility tasks provided by Taqueria            |
| LIGO         | `@taqueria/plugin-ligo`           | A compiler for the LIGO smart contract language             |
| SmartPy      | `@taqueria/plugin-smartpy`        | A compiler for the SmartPy contract language                |
| Flextesa     | `@taqueria/plugin-flextesa`       | A sandbox test network running Tezos Flextesa               | 
| Taquito      | `@taqueria/plugin-taquito`        | A front-end Tezos framework used to originate               |
| TS Generator | `@taqueria/plugin-contract-types` | A type generator that produces TS types from Michelson code |
| TzCompose    | `@taqueria/plugin-tzcompose`      | A tool to facilitate complex deployments via pipelines      |
| Octez Client | `@taqueria/plugin-octez-client`   | Official Tezos client used to interact with the network     |

Taqueria manages plugins by providing installation/uninstallation via the `taq install <pluginName>` and `taq uninstall <pluginName>` tasks. Plugins are installed on a per-project basis during which the NPM package is downloaded and installed on the project, and configuration is added in the `./.taq/config.json` file

### Creating a Taqueria Project

There are two approaches to initializing a Taqueria project: initializing an empty project, or using a pre-configured project scaffold

#### Initializing an empty Taqueria project
1. Initialize a new project: `taq init test-project`
2. Change directories: `cd test-project`
3. Install the LIGO plugin: `taq install @taqueria/plugin-ligo`
4. Continue steps 4-5 for each additional plugin you want to install

##### Note: You may instead run `taq init test-project --workflow ligo` if you'd like to have the necessary plugins pre-installed for you on initialization

#### Using a Taqueria Project Scaffold
1. Run the command `taq scaffold`
2. Change directories: `cd test-project`
3. Run the project setup command `npm run setup`
4. Start the app by running `npm run start`

### Building From Source

If you prefer to build the Taqueria binary and plugins locally, follow the steps detailed below

#### Requirements

- [Deno](https://deno.land/) v1.36 or later
- [NodeJS](https://nodejs.org/en/) v18.18 or later
- [Docker](https://www.docker.com/) v0.9 or later

#### Run Build Script
From the root of the Taqueria directory, run the build-all script:
```shell
npm run build-all
```

## Taqueria Tests
### Unit Tests
Running the unit tests requires deno is installed on your system. Installation instructions can be found [here](https://docs.deno.com/runtime/manual/getting_started/installation)

### E2E and Integration tests
If you are running from built sources, start with `npm run build-all`
- The tests should be run from the taqueria root folder by calling the test run script with the workspace specified: `npm run test:{unit|integration|e2e} -w tests`
- the package.json file in the /tests directory lists various combinations of tests that can be invoked from the command line.



