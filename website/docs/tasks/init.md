---
title: init
---

## Overview

Taq `init` is used to initialize a Taqueria project. It can be used to create a new project from scratch, or can `taq'ify` an existing project

Running `taq init` with no arguments will taq'ify the current directory, while `taq init [path]` will create a new taq'ified directory at the given path

You may also supply the `-w/--workflow` flag if you'd like to have the necessary plugins pre-installed for you depending on what kind of developer you are: ligo, smartpy, archetype, or michelson. E.g. `taq init [path] --workflow [language]`

The task will create the following directories:

- `.taq` - Taqueria configuration files (`config.json`, `state.json`, `development-state.json`)
- `contracts` - The default directory for smart contract source files
- `artifacts` - The default directory for Michelson files

:::note
This is one of two ways to create a taq'ified project, the other is to use the `taq scaffold` [task](/docs/tasks/scaffold)
:::

## Plugin Implementations

This task is implemented by the following plugins:

| Plugin Name                            | Description                             |
| -------------------------------------- | --------------------------------------- |
| N/A                                    | Core task - no plugin implementations   |

### Command

```shell
taq init [path]
```

### Task Details

| Task Name        | Command                       | Type                      | Description                                                  | 
| ---------------- | ----------------------------- | ------------------------- | ------------------------------------------------------------ |
| `init`           | `taq init [path]`             | Core CLI                  | Creates a Taqueria project (taq'ifies a directory)           |

### Command-Line Arguments

| Argument          | Required | Description                                            | Example Usage                                         |
| ----------------- | -------- | ------------------------------------------------------ | ----------------------------------------------------- |
| `[path]`          | No       | Path of the directory to taq'ify                       | `taq init ./myNewTaqueriaProject`                     |

### Usage

| Description                               | Command                            | Behaviour                                                                     |
| ----------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------- |
| Taq'ify the current directory             | `taq init`                         | Taq'ifies the current directory                                               |
| Create and taq'ify the given directory    | `taq init [path]`                  | Creates a new Taq'ified directory                                             |

