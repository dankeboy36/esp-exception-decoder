# ESP Exception Decoder

[![Tests](https://github.com/dankeboy36/esp-exception-decoder/actions/workflows/build.yml/badge.svg)](https://github.com/dankeboy36/esp-exception-decoder/actions/workflows/build.yml)

> ⚠️ This project is in an early state.

[Arduino IDE](https://github.com/arduino/arduino-ide/) extension allows you to get a more meaningful explanation of the stack traces and backtraces you encounter on ESP8266/ESP32. This extension is a reimplementation of the well-known [ESP8266/ESP32 Exception Stack Trace Decoder](https://github.com/me-no-dev/EspExceptionDecoder) tool, which was originally written in Java. The RISC-V decoder implementation was ported from [`esp_idf_monitor`](https://github.com/espressif/esp-idf-monitor/blob/fae383ecf281655abaa5e65433f671e274316d10/esp_idf_monitor/gdb_panic_server.py).

![ESP8266/ESP32 Exception Decoder Extension](./images/espExceptionDecoder_main.png)

> ⚠️ This extension is not related to the [Visual Studio Code extension for Arduino](https://marketplace.visualstudio.com/items?itemName=vsciot-vscode.vscode-arduino). Please note that this extension does not work in VS Code.

## Installation

1. Download the latest extension from the GitHub [release page](https://github.com/dankeboy36/esp-exception-decoder/releases/latest). The filename should be `esp-exception-decoder-${VERSION}.vsix`, where `${VERSION}` is the latest version.
2. Make sure the Arduino IDE is not running. Then, copy the downloaded extension into the `plugins` folder located in the Arduino IDE's configuration directory. If the `plugins` folder does not exist, create it.
   - On Windows, it's under `%UserProfile%\.arduinoIDE\plugins` (typically `C:\Users\<username>\.arduinoIDE\plugins` where `<username>` is your Windows username).
   - On Linux and macOS, it's under `~/.arduinoIDE/plugins`.
     > **ⓘ** If you encounter issues, refer to the [_Installation_](https://github.com/arduino/arduino-ide/blob/main/docs/advanced-usage.md#installation) section of the documentation for Arduino IDE _3rd party themes_. The steps are very similar.

### Update

To update to the latest or a more recent version of the decoder extension, simply copy the new version file into the same `plugins` folder alongside the current version. The Arduino IDE will automatically use the most recent version of the extension. If desired, you can delete the older version to keep your plugins folder organized.

## Usage

1. Open a sketch in the Arduino IDE and verify it.
2. Upload the sketch to your ESP8266/ESP32 board.
3. Open the _Serial Monitor_ view to monitor the output for exceptions.
4. When an exception occurs, open the _Exception Decoder_ terminal:
   - Open the _Command Palette_ using <kbd>Ctrl/⌘</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>.
   - Type `ESP Exception Decoder: Show Decoder Terminal` and press <kbd>Enter</kbd>.
5. Copy the exception stack trace/backtrace from the _Serial Monitor_ view.
6. Paste the stack trace/backtrace into the _Exception Decoder_ terminal.
   > **ⓘ** For more details on copying and pasting in the terminal, check [here](https://code.visualstudio.com/docs/terminal/basics#_copy-paste).

![ESP Exception Decoder in Action](./images/espExceptionDecoder_main.gif)

### Hints

- Enable blinking cursors in the decoder terminal by setting [`"terminal.integrated.cursorBlinking": true`](https://code.visualstudio.com/docs/terminal/appearance#_terminal-cursor).
- Allow pasting in the decoder terminal by setting `"terminal.enablePaste": true`.
- Adjust the terminal font size with the setting [`"terminal.integrated.fontSize": 12`](https://code.visualstudio.com/docs/terminal/appearance#_text-style).

  > **ⓘ** Refer to the [_Advanced settings_](https://github.com/arduino/arduino-ide/blob/main/docs/advanced-usage.md#advanced-settings) documentation of the Arduino IDE for more details.

  > ⚠️ Customizing terminal colors with the [`workbench.colorCustomizations`](https://code.visualstudio.com/docs/terminal/appearance#_terminal-colors) setting is currently unsupported in Eclipse Theia ([eclipse-theia/theia#8060](https://github.com/eclipse-theia/theia/issues/8060)). Therefore, this feature is missing from the Arduino IDE.

  > ⚠️ Arduino IDE must support path links that contain spaces in the decoder terminal. ([eclipse-theia/theia#12643](https://github.com/eclipse-theia/theia/issues/12643))

  > ⚠️ [`terminal.integrated.rightClickBehavior`](https://code.visualstudio.com/docs/terminal/basics#_rightclick-behavior) is not supported in the Arduino IDE. ([eclipse-theia/theia#12644](https://github.com/eclipse-theia/theia/issues/12644))

## Development

1. Install the dependencies:

   ```sh
   npm i
   ```

   > ⚠️ You need Node.js version `>=16.14.0`.

2. Build the extension:

   ```sh
   npm run compile
   ```

   > **ⓘ** Use `npm run package` to bundle the VSIX for production.

3. Test the extension:

   ```sh
   npm run test
   ```

## Hints

- If you are using VS Code for development, you can take advantage of predefined _Launch Configurations_ to debug the extensions and tests. For guidance on how to [test VS Code extensions](https://code.visualstudio.com/api/working-with-extensions/testing-extension), see the documentation.
- This extension utilizes the [`vscode-arduino-api`](https://github.com/dankeboy36/vscode-arduino-api/) to communicate with the Arduino IDE.
- The extension was created from the [`helloworld`](https://code.visualstudio.com/api/get-started/your-first-extension) VS Code extension template.

## Acknowledgments

- Special thanks to [@per1234](https://github.com/per1234) for his dedication to open-source contributions.
- Thanks to [@me-no-dev](https://github.com/me-no-dev) for the [original implementation](https://github.com/me-no-dev/EspExceptionDecoder).
