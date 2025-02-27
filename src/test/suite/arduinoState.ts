// @ts-check

import type { ArduinoState } from 'vscode-arduino-api';

export const arduinoState: ArduinoState = {
  sketchPath: '/Users/kittaakos/Documents/Arduino/riscv_1',
  fqbn: 'esp32:esp32:esp32c3',
  userDirPath: '/Users/kittaakos/Documents/Arduino',
  dataDirPath: '/Users/kittaakos/Library/Arduino15',
  boardDetails: {
    buildProperties: {
      version: '3.1.1',
      'tools.esp32-arduino-libs.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1',
      'tools.xtensa-esp-elf-gcc.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-x32/2405',
      'tools.xtensa-esp-elf-gdb.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/xtensa-esp-elf-gdb/14.2_20240403',
      'tools.riscv32-esp-elf-gcc.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-rv32/2405',
      'tools.riscv32-esp-elf-gdb.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/riscv32-esp-elf-gdb/14.2_20240403',
      'tools.esptool_py.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esptool_py/4.9.dev3',
      'tools.esptool_py.cmd': 'esptool',
      'tools.esptool_py.cmd.windows': 'esptool.exe',
      'tools.esptool_py.network_cmd':
        'python3 "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/tools/espota.py" -r',
      'tools.esptool_py.network_cmd.windows':
        '"/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1\\tools\\espota.exe" -r',
      'tools.esp_ota.cmd':
        'python3 "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/tools/espota.py" -r',
      'tools.esp_ota.cmd.windows':
        '"/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1\\tools\\espota.exe" -r',
      'tools.gen_esp32part.cmd':
        'python3 "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/tools/gen_esp32part.py"',
      'tools.gen_esp32part.cmd.windows':
        '"/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1\\tools\\gen_esp32part.exe"',
      'tools.gen_insights_pkg.cmd':
        'python3 "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1"/tools/gen_insights_package.py',
      'tools.gen_insights_pkg.cmd.windows':
        '"/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1\\tools\\gen_insights_package.exe"',
      'compiler.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-rv32/2405/bin/',
      'compiler.prefix': 'riscv32-esp-elf-',
      'compiler.sdk.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3',
      'compiler.sdk.path.windows':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1\\esp32c3',
      'compiler.optimization_flags': '-Os',
      'compiler.optimization_flags.release': '-Os',
      'compiler.optimization_flags.debug': '-Og -g3',
      'compiler.warning_flags': '-w',
      'compiler.warning_flags.none': '-w',
      'compiler.warning_flags.default': '',
      'compiler.warning_flags.more': '-Wall',
      'compiler.warning_flags.all': '-Wall -Wextra',
      'compiler.common_werror_flags': '-Werror=return-type',
      'compiler.cpreprocessor.flags':
        '"@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/defines" "-I{build.source.path}" -iprefix "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/include/" "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/includes" "-I/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/qio_qspi/include"',
      'compiler.c.flags':
        '-MMD -c "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/c_flags" -w -Os -Werror=return-type',
      'compiler.cpp.flags':
        '-MMD -c "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/cpp_flags" -w -Os -Werror=return-type',
      'compiler.S.flags':
        '-MMD -c -x assembler-with-cpp "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/S_flags" -w -Os',
      'compiler.c.elf.flags':
        '"-Wl,--Map={build.path}/{build.project_name}.map" "-L/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/lib" "-L/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/ld" "-L/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/qio_qspi" "-Wl,--wrap=esp_panic_handler" "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/ld_flags" "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/ld_scripts"',
      'compiler.c.elf.libs':
        '"@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/ld_libs"',
      'compiler.ar.flags': 'cr',
      'compiler.c.cmd': 'riscv32-esp-elf-gcc',
      'compiler.cpp.cmd': 'riscv32-esp-elf-g++',
      'compiler.S.cmd': 'riscv32-esp-elf-gcc',
      'compiler.c.elf.cmd': 'riscv32-esp-elf-g++',
      'compiler.as.cmd': 'riscv32-esp-elf-as',
      'compiler.ar.cmd': 'riscv32-esp-elf-gcc-ar',
      'compiler.size.cmd': 'riscv32-esp-elf-size',
      'compiler.c.extra_flags': '',
      'compiler.cpp.extra_flags': '',
      'compiler.S.extra_flags': '',
      'compiler.c.elf.extra_flags': '',
      'compiler.ar.extra_flags': '',
      'compiler.objcopy.eep.extra_flags': '',
      'compiler.elf2hex.extra_flags': '',
      'compiler.libraries.ldflags': '',
      'build.extra_flags.esp32': '-DARDUINO_USB_CDC_ON_BOOT=0',
      'build.extra_flags.esp32s3':
        '-DARDUINO_USB_MODE={build.usb_mode} -DARDUINO_USB_CDC_ON_BOOT=0 -DARDUINO_USB_MSC_ON_BOOT={build.msc_on_boot} -DARDUINO_USB_DFU_ON_BOOT={build.dfu_on_boot}',
      'build.extra_flags.esp32s2':
        '-DARDUINO_USB_MODE=0 -DARDUINO_USB_CDC_ON_BOOT=0 -DARDUINO_USB_MSC_ON_BOOT={build.msc_on_boot} -DARDUINO_USB_DFU_ON_BOOT={build.dfu_on_boot}',
      'build.extra_flags.esp32c2': '-DARDUINO_USB_CDC_ON_BOOT=0',
      'build.extra_flags.esp32c3':
        '-DARDUINO_USB_MODE=1 -DARDUINO_USB_CDC_ON_BOOT=0',
      'build.extra_flags.esp32c6':
        '-DARDUINO_USB_MODE=1 -DARDUINO_USB_CDC_ON_BOOT=0',
      'build.extra_flags.esp32h2':
        '-DARDUINO_USB_MODE=1 -DARDUINO_USB_CDC_ON_BOOT=0',
      'build.extra_flags.esp32p4':
        '-DARDUINO_USB_MODE={build.usb_mode} -DARDUINO_USB_CDC_ON_BOOT=0 -DARDUINO_USB_MSC_ON_BOOT={build.msc_on_boot} -DARDUINO_USB_DFU_ON_BOOT={build.dfu_on_boot}',
      'build.img_freq': '80m',
      'build.boot_freq': '80m',
      'build.custom_bootloader': 'bootloader',
      'build.custom_partitions': 'partitions',
      'build.loop_core': '',
      'build.event_core': '',
      'build.extra_flags':
        '-DARDUINO_HOST_OS="macosx" -DARDUINO_FQBN="esp32:esp32:esp32c3" -DESP32=ESP32 -DCORE_DEBUG_LEVEL=0    -DARDUINO_USB_MODE=1 -DARDUINO_USB_CDC_ON_BOOT=0 ',
      'build.extra_libs': '',
      'build.memory_type': 'qio_qspi',
      'build.opt.name': 'build_opt.h',
      'build.opt.path': '{build.path}/build_opt.h',
      'recipe.hooks.prebuild.1.pattern':
        '/usr/bin/env bash -c "[ ! -f "{build.source.path}"/partitions.csv ] || cp -f "{build.source.path}"/partitions.csv "{build.path}"/partitions.csv"',
      'recipe.hooks.prebuild.2.pattern':
        '/usr/bin/env bash -c "[ -f "{build.path}"/partitions.csv ] || [ ! -f "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/variants/esp32c3"/partitions.csv ] || cp "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/variants/esp32c3"/partitions.csv "{build.path}"/partitions.csv"',
      'recipe.hooks.prebuild.3.pattern':
        '/usr/bin/env bash -c "[ -f "{build.path}"/partitions.csv ] || cp "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1"/tools/partitions/default.csv "{build.path}"/partitions.csv"',
      'recipe.hooks.prebuild.1.pattern.windows':
        'cmd /c if exist "{build.source.path}\\partitions.csv" COPY /y "{build.source.path}\\partitions.csv" "{build.path}\\partitions.csv"',
      'recipe.hooks.prebuild.2.pattern.windows':
        'cmd /c if not exist "{build.path}\\partitions.csv" if exist "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/variants/esp32c3\\partitions.csv" COPY "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/variants/esp32c3\\partitions.csv" "{build.path}\\partitions.csv"',
      'recipe.hooks.prebuild.3.pattern.windows':
        'cmd /c if not exist "{build.path}\\partitions.csv" COPY "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1\\tools\\partitions\\default.csv" "{build.path}\\partitions.csv"',
      'recipe.hooks.prebuild.4.pattern_args':
        '--chip esp32c3 elf2image --flash_mode dio --flash_freq 80m --flash_size 4MB -o',
      'recipe.hooks.prebuild.4.pattern':
        '/usr/bin/env bash -c "[ -f "{build.source.path}"/bootloader.bin ] && cp -f "{build.source.path}"/bootloader.bin "{build.path}"/{build.project_name}.bootloader.bin || ( [ -f "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/variants/esp32c3"/bootloader.bin ] && cp "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/variants/esp32c3"/bootloader.bin "{build.path}"/{build.project_name}.bootloader.bin || "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esptool_py/4.9.dev3"/esptool --chip esp32c3 elf2image --flash_mode dio --flash_freq 80m --flash_size 4MB -o "{build.path}"/{build.project_name}.bootloader.bin "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3"/bin/bootloader_qio_80m.elf )"',
      'recipe.hooks.prebuild.4.pattern.windows':
        'cmd /c IF EXIST "{build.source.path}\\bootloader.bin" ( COPY /y "{build.source.path}\\bootloader.bin" "{build.path}\\{build.project_name}.bootloader.bin" ) ELSE ( IF EXIST "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/variants/esp32c3\\bootloader.bin" ( COPY "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/variants/esp32c3\\bootloader.bin" "{build.path}\\{build.project_name}.bootloader.bin" ) ELSE ( "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esptool_py/4.9.dev3\\esptool" --chip esp32c3 elf2image --flash_mode dio --flash_freq 80m --flash_size 4MB -o "{build.path}\\{build.project_name}.bootloader.bin" "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3\\bin\\bootloader_qio_80m.elf" ) )',
      'recipe.hooks.prebuild.5.pattern':
        '/usr/bin/env bash -c "[ ! -f "{build.source.path}"/build_opt.h ] || cp -f "{build.source.path}"/build_opt.h "{build.path}"/build_opt.h"',
      'recipe.hooks.prebuild.6.pattern':
        '/usr/bin/env bash -c "[ -f "{build.path}"/build_opt.h ] || : > "{build.path}"/build_opt.h"',
      'recipe.hooks.prebuild.5.pattern.windows':
        'cmd /c if exist "{build.source.path}\\build_opt.h" COPY /y "{build.source.path}\\build_opt.h" "{build.path}\\build_opt.h"',
      'recipe.hooks.prebuild.6.pattern.windows':
        'cmd /c if not exist "{build.path}\\build_opt.h" type nul > "{build.path}\\build_opt.h"',
      'file_opts.path': '{build.path}/file_opts',
      'recipe.hooks.prebuild.7.pattern':
        '/usr/bin/env bash -c ": > \'{build.path}/file_opts\'"',
      'recipe.hooks.core.prebuild.1.pattern':
        '/usr/bin/env bash -c "echo -DARDUINO_CORE_BUILD > \'{build.path}/file_opts\'"',
      'recipe.hooks.core.postbuild.1.pattern':
        '/usr/bin/env bash -c ": > \'{build.path}/file_opts\'"',
      'recipe.hooks.prebuild.7.pattern.windows':
        'cmd /c type nul > "{build.path}/file_opts"',
      'recipe.hooks.core.prebuild.1.pattern.windows':
        'cmd /c echo "-DARDUINO_CORE_BUILD" > "{build.path}/file_opts"',
      'recipe.hooks.core.postbuild.1.pattern.windows':
        'cmd /c type nul > "{build.path}/file_opts"',
      'recipe.hooks.prebuild.8.pattern':
        '/usr/bin/env bash -c "cp -f "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3"/sdkconfig "{build.path}"/sdkconfig"',
      'recipe.hooks.prebuild.8.pattern.windows':
        'cmd /c COPY /y "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3\\sdkconfig" "{build.path}\\sdkconfig"',
      'recipe.c.o.pattern':
        '"/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-rv32/2405/bin/riscv32-esp-elf-gcc"  -MMD -c "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/c_flags" -w -Os -Werror=return-type -DF_CPU=160000000L -DARDUINO=10607 -DARDUINO_ESP32C3_DEV -DARDUINO_ARCH_ESP32 -DARDUINO_BOARD="ESP32C3_DEV" -DARDUINO_VARIANT="esp32c3" -DARDUINO_PARTITION_default -DARDUINO_HOST_OS="macosx" -DARDUINO_FQBN="esp32:esp32:esp32c3" -DESP32=ESP32 -DCORE_DEBUG_LEVEL=0    -DARDUINO_USB_MODE=1 -DARDUINO_USB_CDC_ON_BOOT=0  "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/defines" "-I{build.source.path}" -iprefix "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/include/" "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/includes" "-I/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/qio_qspi/include" {includes} "@{build.path}/build_opt.h" "@{build.path}/file_opts" "{source_file}" -o "{object_file}"',
      'recipe.cpp.o.pattern':
        '"/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-rv32/2405/bin/riscv32-esp-elf-g++"  -MMD -c "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/cpp_flags" -w -Os -Werror=return-type -DF_CPU=160000000L -DARDUINO=10607 -DARDUINO_ESP32C3_DEV -DARDUINO_ARCH_ESP32 -DARDUINO_BOARD="ESP32C3_DEV" -DARDUINO_VARIANT="esp32c3" -DARDUINO_PARTITION_default -DARDUINO_HOST_OS="macosx" -DARDUINO_FQBN="esp32:esp32:esp32c3" -DESP32=ESP32 -DCORE_DEBUG_LEVEL=0    -DARDUINO_USB_MODE=1 -DARDUINO_USB_CDC_ON_BOOT=0  "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/defines" "-I{build.source.path}" -iprefix "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/include/" "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/includes" "-I/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/qio_qspi/include" {includes} "@{build.path}/build_opt.h" "@{build.path}/file_opts" "{source_file}" -o "{object_file}"',
      'recipe.S.o.pattern':
        '"/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-rv32/2405/bin/riscv32-esp-elf-gcc"  -MMD -c -x assembler-with-cpp "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/S_flags" -w -Os -DF_CPU=160000000L -DARDUINO=10607 -DARDUINO_ESP32C3_DEV -DARDUINO_ARCH_ESP32 -DARDUINO_BOARD="ESP32C3_DEV" -DARDUINO_VARIANT="esp32c3" -DARDUINO_PARTITION_default -DARDUINO_HOST_OS="macosx" -DARDUINO_FQBN="esp32:esp32:esp32c3" -DESP32=ESP32 -DCORE_DEBUG_LEVEL=0    -DARDUINO_USB_MODE=1 -DARDUINO_USB_CDC_ON_BOOT=0  "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/defines" "-I{build.source.path}" -iprefix "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/include/" "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/includes" "-I/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/qio_qspi/include" {includes} "@{build.path}/build_opt.h" "@{build.path}/file_opts" "{source_file}" -o "{object_file}"',
      'recipe.ar.pattern':
        '"/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-rv32/2405/bin/riscv32-esp-elf-gcc-ar" cr  "{archive_file_path}" "{object_file}"',
      'recipe.c.combine.pattern':
        '"/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-rv32/2405/bin/riscv32-esp-elf-g++" "-Wl,--Map={build.path}/{build.project_name}.map" "-L/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/lib" "-L/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/ld" "-L/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/qio_qspi" "-Wl,--wrap=esp_panic_handler" "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/ld_flags" "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/ld_scripts"  -Wl,--start-group {object_files} "{archive_file_path}"   "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/ld_libs"  -Wl,--end-group -Wl,-EL -o "{build.path}/{build.project_name}.elf"',
      'recipe.objcopy.partitions.bin.pattern':
        'python3 "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/tools/gen_esp32part.py" -q "{build.path}/partitions.csv" "{build.path}/{build.project_name}.partitions.bin"',
      'recipe.objcopy.bin.pattern_args':
        '--chip esp32c3 elf2image --flash_mode "dio" --flash_freq "80m" --flash_size "4MB" --elf-sha256-offset 0xb0 -o "{build.path}/{build.project_name}.bin" "{build.path}/{build.project_name}.elf"',
      'recipe.objcopy.bin.pattern':
        '"/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esptool_py/4.9.dev3/esptool" --chip esp32c3 elf2image --flash_mode "dio" --flash_freq "80m" --flash_size "4MB" --elf-sha256-offset 0xb0 -o "{build.path}/{build.project_name}.bin" "{build.path}/{build.project_name}.elf"',
      'recipe.hooks.objcopy.postobjcopy.1.pattern_args':
        '{build.path} {build.project_name} "{build.source.path}"',
      'recipe.hooks.objcopy.postobjcopy.1.pattern':
        '/usr/bin/env bash -c "[ ! -d "{build.path}"/libraries/Insights ] || python3 "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1"/tools/gen_insights_package.py {build.path} {build.project_name} "{build.source.path}""',
      'recipe.hooks.objcopy.postobjcopy.1.pattern.windows':
        'cmd /c if exist "{build.path}\\libraries\\Insights" python3 "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1"/tools/gen_insights_package.py {build.path} {build.project_name} "{build.source.path}"',
      'recipe.hooks.objcopy.postobjcopy.2.pattern':
        '/usr/bin/env bash -c "[ ! -d "{build.path}"/libraries/ESP_SR ] || [ ! -f "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3"/esp_sr/srmodels.bin ] || cp -f "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3"/esp_sr/srmodels.bin "{build.path}"/srmodels.bin"',
      'recipe.hooks.objcopy.postobjcopy.2.pattern.windows':
        'cmd /c if exist "{build.path}\\libraries\\ESP_SR" if exist "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3\\esp_sr\\srmodels.bin" COPY /y "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3\\esp_sr\\srmodels.bin" "{build.path}\\srmodels.bin"',
      'recipe.hooks.objcopy.postobjcopy.3.pattern_args':
        '--chip esp32c3 merge_bin -o "{build.path}/{build.project_name}.merged.bin" --fill-flash-size 4MB --flash_mode keep --flash_freq keep --flash_size keep 0x0 "{build.path}/{build.project_name}.bootloader.bin" 0x8000 "{build.path}/{build.project_name}.partitions.bin" 0xe000 "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/tools/partitions/boot_app0.bin" 0x10000 "{build.path}/{build.project_name}.bin"',
      'recipe.hooks.objcopy.postobjcopy.3.pattern':
        '"/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esptool_py/4.9.dev3/esptool" --chip esp32c3 merge_bin -o "{build.path}/{build.project_name}.merged.bin" --fill-flash-size 4MB --flash_mode keep --flash_freq keep --flash_size keep 0x0 "{build.path}/{build.project_name}.bootloader.bin" 0x8000 "{build.path}/{build.project_name}.partitions.bin" 0xe000 "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/tools/partitions/boot_app0.bin" 0x10000 "{build.path}/{build.project_name}.bin"',
      'recipe.output.tmp_file': '{build.project_name}.bin',
      'recipe.output.save_file': '{build.project_name}.esp32c3.bin',
      'recipe.size.pattern':
        '"/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-rv32/2405/bin/riscv32-esp-elf-size" -A "{build.path}/{build.project_name}.elf"',
      'recipe.size.regex':
        '^(?:\\.iram0\\.text|\\.iram0\\.vectors|\\.dram0\\.data|\\.dram1\\.data|\\.flash\\.text|\\.flash\\.rodata|\\.flash\\.appdesc|\\.flash\\.init_array|\\.eh_frame|)\\s+([0-9]+).*',
      'recipe.size.regex.data':
        '^(?:\\.dram0\\.data|\\.dram0\\.bss|\\.dram1\\.data|\\.dram1\\.bss|\\.noinit)\\s+([0-9]+).*',
      'pluggable_discovery.required.0': 'builtin:serial-discovery',
      'pluggable_discovery.required.1': 'builtin:mdns-discovery',
      'pluggable_monitor.required.serial': 'builtin:serial-monitor',
      'debug_script.esp32': 'esp32-wrover-kit-3.3v.cfg',
      'debug_config.esp32.cortex-debug.custom.name': 'Arduino on ESP32',
      'debug_config.esp32.cortex-debug.custom.postAttachCommands.0':
        'set remote hardware-watchpoint-limit 2',
      'debug_config.esp32.cortex-debug.custom.postAttachCommands.1':
        'monitor reset halt',
      'debug_config.esp32.cortex-debug.custom.postAttachCommands.2':
        'monitor gdb_sync',
      'debug_config.esp32.cortex-debug.custom.postAttachCommands.3':
        'thb setup',
      'debug_config.esp32.cortex-debug.custom.postAttachCommands.4': 'c',
      'debug_config.esp32.cortex-debug.custom.overrideRestartCommands.0':
        'monitor reset halt',
      'debug_config.esp32.cortex-debug.custom.overrideRestartCommands.1':
        'monitor gdb_sync',
      'debug_config.esp32.cortex-debug.custom.overrideRestartCommands.2':
        'thb setup',
      'debug_config.esp32.cortex-debug.custom.overrideRestartCommands.3': 'c',
      'debug_script.esp32s2': 'esp32s2-kaluga-1.cfg',
      'debug_config.esp32s2.cortex-debug.custom.name': 'Arduino on ESP32-S2',
      'debug_config.esp32s2.cortex-debug.custom.postAttachCommands.0':
        'set remote hardware-watchpoint-limit 2',
      'debug_config.esp32s2.cortex-debug.custom.postAttachCommands.1':
        'monitor reset halt',
      'debug_config.esp32s2.cortex-debug.custom.postAttachCommands.2':
        'monitor gdb_sync',
      'debug_config.esp32s2.cortex-debug.custom.postAttachCommands.3':
        'thb setup',
      'debug_config.esp32s2.cortex-debug.custom.postAttachCommands.4': 'c',
      'debug_config.esp32s2.cortex-debug.custom.overrideRestartCommands.0':
        'monitor reset halt',
      'debug_config.esp32s2.cortex-debug.custom.overrideRestartCommands.1':
        'monitor gdb_sync',
      'debug_config.esp32s2.cortex-debug.custom.overrideRestartCommands.2':
        'thb setup',
      'debug_config.esp32s2.cortex-debug.custom.overrideRestartCommands.3': 'c',
      'debug_script.esp32s3': 'esp32s3-builtin.cfg',
      'debug_config.esp32s3.cortex-debug.custom.name': 'Arduino on ESP32-S3',
      'debug_config.esp32s3.cortex-debug.custom.overrideAttachCommands.0':
        'set remote hardware-watchpoint-limit 2',
      'debug_config.esp32s3.cortex-debug.custom.overrideAttachCommands.1':
        'monitor reset halt',
      'debug_config.esp32s3.cortex-debug.custom.overrideAttachCommands.2':
        'monitor gdb_sync',
      'debug_config.esp32s3.cortex-debug.custom.overrideAttachCommands.3':
        'thb setup',
      'debug_config.esp32s3.cortex-debug.custom.overrideAttachCommands.4': 'c',
      'debug_config.esp32s3.cortex-debug.custom.overrideRestartCommands.0':
        'monitor reset halt',
      'debug_config.esp32s3.cortex-debug.custom.overrideRestartCommands.1':
        'monitor gdb_sync',
      'debug_script.esp32c3': 'esp32c3-builtin.cfg',
      'debug_config.esp32c3.cortex-debug.custom.name': 'Arduino on ESP32-C3',
      'debug_config.esp32c3.cortex-debug.custom.serverArgs.0': '-d3',
      'debug_config.esp32c3.cortex-debug.custom.overrideAttachCommands.0':
        'set remote hardware-watchpoint-limit 8',
      'debug_config.esp32c3.cortex-debug.custom.overrideAttachCommands.1':
        'monitor reset',
      'debug_config.esp32c3.cortex-debug.custom.overrideAttachCommands.2':
        'monitor halt',
      'debug_config.esp32c3.cortex-debug.custom.overrideAttachCommands.3':
        'monitor gdb_sync',
      'debug_config.esp32c3.cortex-debug.custom.overrideAttachCommands.4':
        'thb setup',
      'debug_config.esp32c3.cortex-debug.custom.overrideRestartCommands.0':
        'monitor reset',
      'debug_config.esp32c3.cortex-debug.custom.overrideRestartCommands.1':
        'monitor halt',
      'debug_config.esp32c3.cortex-debug.custom.overrideRestartCommands.2':
        'monitor gdb_sync',
      'debug_config.esp32c3.cortex-debug.custom.overrideRestartCommands.3':
        'thb setup',
      'debug_script.esp32c6': 'esp32c6-builtin.cfg',
      'debug_config.esp32c6': '',
      'debug_script.esp32h2': 'esp32h2-builtin.cfg',
      'debug_config.esp32h2': '',
      'debug.executable': '{build.path}/{build.project_name}.elf',
      'debug.toolchain': 'gcc',
      'debug.toolchain.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/riscv32-esp-elf-gdb/14.2_20240403/bin/',
      'debug.toolchain.prefix': 'riscv32-esp-elf',
      'debug.server': 'openocd',
      'debug.server.openocd.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/openocd-esp32/v0.12.0-esp32-20241016/bin/openocd',
      'debug.server.openocd.scripts_dir':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/openocd-esp32/v0.12.0-esp32-20241016/share/openocd/scripts/',
      'debug.server.openocd.scripts_dir.windows':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/openocd-esp32/v0.12.0-esp32-20241016\\share\\openocd\\scripts\\',
      'debug.server.openocd.scripts.0': 'board/esp32c3-builtin.cfg',
      'debug.svd_file':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/tools/ide-debug/svd/esp32c3.svd',
      'debug.cortex-debug.custom.objdumpPath':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-rv32/2405/bin/riscv32-esp-elf-objdump',
      'debug.cortex-debug.custom.request': 'attach',
      'debug.additional_config': 'debug_config.esp32c3',
      'tools.esptool_py.upload.protocol': 'serial',
      'tools.esptool_py.upload.params.verbose': '',
      'tools.esptool_py.upload.params.quiet': '',
      'tools.esptool_py.upload.pattern_args':
        '--chip esp32c3 --port "{serial.port}" --baud 921600  --before default_reset --after hard_reset write_flash  -z --flash_mode keep --flash_freq keep --flash_size keep 0x0 "{build.path}/{build.project_name}.bootloader.bin" 0x8000 "{build.path}/{build.project_name}.partitions.bin" 0xe000 "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/tools/partitions/boot_app0.bin" 0x10000 "{build.path}/{build.project_name}.bin" ',
      'tools.esptool_py.upload.pattern': '"{path}/{cmd}" {upload.pattern_args}',
      'tools.esptool_py.program.params.verbose': '',
      'tools.esptool_py.program.params.quiet': '',
      'tools.esptool_py.program.pattern_args':
        '--chip esp32c3 --port "{serial.port}" --baud 921600  --before default_reset --after hard_reset write_flash -z --flash_mode keep --flash_freq keep --flash_size keep 0x10000 "{build.path}/{build.project_name}.bin"',
      'tools.esptool_py.program.pattern':
        '"{path}/{cmd}" {program.pattern_args}',
      'tools.esptool_py.erase.protocol': 'serial',
      'tools.esptool_py.erase.params.verbose': '',
      'tools.esptool_py.erase.params.quiet': '',
      'tools.esptool_py.erase.pattern_args':
        '--chip esp32c3 --port "{serial.port}" --baud 921600  --before default_reset --after hard_reset erase_flash',
      'tools.esptool_py.erase.pattern': '"{path}/{cmd}" {erase.pattern_args}',
      'tools.esptool_py.bootloader.protocol': 'serial',
      'tools.esptool_py.bootloader.params.verbose': '',
      'tools.esptool_py.bootloader.params.quiet': '',
      'tools.esptool_py.bootloader.pattern': '',
      'tools.esptool_py.upload.network_pattern':
        '{network_cmd} -i "{serial.port}" -p "{network.port}" "--auth={network.password}" -f "{build.path}/{build.project_name}.bin"',
      'tools.esp_ota.upload.protocol': 'network',
      'tools.esp_ota.upload.field.password': 'Password',
      'tools.esp_ota.upload.field.password.secret': 'true',
      'tools.esp_ota.upload.pattern':
        '{cmd} -i {upload.port.address} -p {upload.port.properties.port} "--auth={upload.field.password}" -f "{build.path}/{build.project_name}.bin"',
      'tools.dfu-util.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/dfu-util/0.11.0-arduino5',
      'tools.dfu-util.cmd': 'dfu-util',
      'tools.dfu-util.upload.params.verbose': '-d',
      'tools.dfu-util.upload.params.quiet': '',
      'tools.dfu-util.upload.pattern':
        '"{path}/{cmd}" --device {vid.0}:{pid.0} -D "{build.path}/{build.project_name}.bin" -Q',
      name: 'ESP32C3 Dev Module',
      'bootloader.tool': 'esptool_py',
      'bootloader.tool.default': 'esptool_py',
      'upload.tool': 'esptool_py',
      'upload.tool.default': 'esptool_py',
      'upload.tool.network': 'esp_ota',
      'upload.maximum_size': '1310720',
      'upload.maximum_data_size': '327680',
      'upload.flags': '',
      'upload.extra_flags': '',
      'upload.use_1200bps_touch': 'false',
      'upload.wait_for_upload_port': 'false',
      'serial.disableDTR': 'false',
      'serial.disableRTS': 'false',
      'build.tarch': 'riscv32',
      'build.target': 'esp',
      'build.mcu': 'esp32c3',
      'build.core': 'esp32',
      'build.variant': 'esp32c3',
      'build.board': 'ESP32C3_DEV',
      'build.bootloader_addr': '0x0',
      'build.defines': '',
      'menu.JTAGAdapter.default': 'Disabled',
      'menu.JTAGAdapter.default.build.copy_jtag_files': '0',
      'menu.JTAGAdapter.builtin': 'Integrated USB JTAG',
      'menu.JTAGAdapter.builtin.build.openocdscript': 'esp32c3-builtin.cfg',
      'menu.JTAGAdapter.builtin.build.copy_jtag_files': '1',
      'menu.JTAGAdapter.external': 'FTDI Adapter',
      'menu.JTAGAdapter.external.build.openocdscript': 'esp32c3-ftdi.cfg',
      'menu.JTAGAdapter.external.build.copy_jtag_files': '1',
      'menu.JTAGAdapter.bridge': 'ESP USB Bridge',
      'menu.JTAGAdapter.bridge.build.openocdscript': 'esp32c3-bridge.cfg',
      'menu.JTAGAdapter.bridge.build.copy_jtag_files': '1',
      'menu.CDCOnBoot.default': 'Disabled',
      'menu.CDCOnBoot.default.build.cdc_on_boot': '0',
      'menu.CDCOnBoot.cdc': 'Enabled',
      'menu.CDCOnBoot.cdc.build.cdc_on_boot': '1',
      'menu.PartitionScheme.default':
        'Default 4MB with spiffs (1.2MB APP/1.5MB SPIFFS)',
      'menu.PartitionScheme.default.build.partitions': 'default',
      'menu.PartitionScheme.defaultffat':
        'Default 4MB with ffat (1.2MB APP/1.5MB FATFS)',
      'menu.PartitionScheme.defaultffat.build.partitions': 'default_ffat',
      'menu.PartitionScheme.default_8MB':
        '8M with spiffs (3MB APP/1.5MB SPIFFS)',
      'menu.PartitionScheme.default_8MB.build.partitions': 'default_8MB',
      'menu.PartitionScheme.default_8MB.upload.maximum_size': '3342336',
      'menu.PartitionScheme.minimal': 'Minimal (1.3MB APP/700KB SPIFFS)',
      'menu.PartitionScheme.minimal.build.partitions': 'minimal',
      'menu.PartitionScheme.no_fs': 'No FS 4MB (2MB APP x2)',
      'menu.PartitionScheme.no_fs.build.partitions': 'no_fs',
      'menu.PartitionScheme.no_fs.upload.maximum_size': '2031616',
      'menu.PartitionScheme.no_ota': 'No OTA (2MB APP/2MB SPIFFS)',
      'menu.PartitionScheme.no_ota.build.partitions': 'no_ota',
      'menu.PartitionScheme.no_ota.upload.maximum_size': '2097152',
      'menu.PartitionScheme.noota_3g': 'No OTA (1MB APP/3MB SPIFFS)',
      'menu.PartitionScheme.noota_3g.build.partitions': 'noota_3g',
      'menu.PartitionScheme.noota_3g.upload.maximum_size': '1048576',
      'menu.PartitionScheme.noota_ffat': 'No OTA (2MB APP/2MB FATFS)',
      'menu.PartitionScheme.noota_ffat.build.partitions': 'noota_ffat',
      'menu.PartitionScheme.noota_ffat.upload.maximum_size': '2097152',
      'menu.PartitionScheme.noota_3gffat': 'No OTA (1MB APP/3MB FATFS)',
      'menu.PartitionScheme.noota_3gffat.build.partitions': 'noota_3gffat',
      'menu.PartitionScheme.noota_3gffat.upload.maximum_size': '1048576',
      'menu.PartitionScheme.huge_app': 'Huge APP (3MB No OTA/1MB SPIFFS)',
      'menu.PartitionScheme.huge_app.build.partitions': 'huge_app',
      'menu.PartitionScheme.huge_app.upload.maximum_size': '3145728',
      'menu.PartitionScheme.min_spiffs':
        'Minimal SPIFFS (1.9MB APP with OTA/190KB SPIFFS)',
      'menu.PartitionScheme.min_spiffs.build.partitions': 'min_spiffs',
      'menu.PartitionScheme.min_spiffs.upload.maximum_size': '1966080',
      'menu.PartitionScheme.fatflash': '16M Flash (2MB APP/12.5MB FATFS)',
      'menu.PartitionScheme.fatflash.build.partitions': 'ffat',
      'menu.PartitionScheme.fatflash.upload.maximum_size': '2097152',
      'menu.PartitionScheme.app3M_fat9M_16MB':
        '16M Flash (3MB APP/9.9MB FATFS)',
      'menu.PartitionScheme.app3M_fat9M_16MB.build.partitions':
        'app3M_fat9M_16MB',
      'menu.PartitionScheme.app3M_fat9M_16MB.upload.maximum_size': '3145728',
      'menu.PartitionScheme.rainmaker': 'RainMaker 4MB',
      'menu.PartitionScheme.rainmaker.build.partitions': 'rainmaker',
      'menu.PartitionScheme.rainmaker.upload.maximum_size': '1966080',
      'menu.PartitionScheme.rainmaker_4MB': 'RainMaker 4MB No OTA',
      'menu.PartitionScheme.rainmaker_4MB.build.partitions':
        'rainmaker_4MB_no_ota',
      'menu.PartitionScheme.rainmaker_4MB.upload.maximum_size': '4038656',
      'menu.PartitionScheme.rainmaker_8MB': 'RainMaker 8MB',
      'menu.PartitionScheme.rainmaker_8MB.build.partitions': 'rainmaker_8MB',
      'menu.PartitionScheme.rainmaker_8MB.upload.maximum_size': '4116480',
      'menu.PartitionScheme.zigbee_zczr': 'Zigbee ZCZR 4MB with spiffs',
      'menu.PartitionScheme.zigbee_zczr.build.partitions': 'zigbee_zczr',
      'menu.PartitionScheme.zigbee_zczr.upload.maximum_size': '1310720',
      'menu.PartitionScheme.custom': 'Custom',
      'menu.PartitionScheme.custom.build.partitions': '',
      'menu.PartitionScheme.custom.upload.maximum_size': '16777216',
      'menu.CPUFreq.160': '160MHz (WiFi)',
      'menu.CPUFreq.160.build.f_cpu': '160000000L',
      'menu.CPUFreq.80': '80MHz (WiFi)',
      'menu.CPUFreq.80.build.f_cpu': '80000000L',
      'menu.CPUFreq.40': '40MHz',
      'menu.CPUFreq.40.build.f_cpu': '40000000L',
      'menu.CPUFreq.20': '20MHz',
      'menu.CPUFreq.20.build.f_cpu': '20000000L',
      'menu.CPUFreq.10': '10MHz',
      'menu.CPUFreq.10.build.f_cpu': '10000000L',
      'menu.FlashMode.qio': 'QIO',
      'menu.FlashMode.qio.build.flash_mode': 'dio',
      'menu.FlashMode.qio.build.boot': 'qio',
      'menu.FlashMode.dio': 'DIO',
      'menu.FlashMode.dio.build.flash_mode': 'dio',
      'menu.FlashMode.dio.build.boot': 'dio',
      'menu.FlashFreq.80': '80MHz',
      'menu.FlashFreq.80.build.flash_freq': '80m',
      'menu.FlashFreq.40': '40MHz',
      'menu.FlashFreq.40.build.flash_freq': '40m',
      'menu.FlashSize.4M': '4MB (32Mb)',
      'menu.FlashSize.4M.build.flash_size': '4MB',
      'menu.FlashSize.8M': '8MB (64Mb)',
      'menu.FlashSize.8M.build.flash_size': '8MB',
      'menu.FlashSize.2M': '2MB (16Mb)',
      'menu.FlashSize.2M.build.flash_size': '2MB',
      'menu.FlashSize.16M': '16MB (128Mb)',
      'menu.FlashSize.16M.build.flash_size': '16MB',
      'menu.UploadSpeed.921600': '921600',
      'menu.UploadSpeed.921600.upload.speed': '921600',
      'menu.UploadSpeed.115200': '115200',
      'menu.UploadSpeed.115200.upload.speed': '115200',
      'menu.UploadSpeed.256000.windows': '256000',
      'menu.UploadSpeed.256000.upload.speed': '256000',
      'menu.UploadSpeed.230400.windows.upload.speed': '256000',
      'menu.UploadSpeed.230400': '230400',
      'menu.UploadSpeed.230400.upload.speed': '230400',
      'menu.UploadSpeed.460800.linux': '460800',
      'menu.UploadSpeed.460800': '460800',
      'menu.UploadSpeed.460800.upload.speed': '460800',
      'menu.UploadSpeed.512000.windows': '512000',
      'menu.UploadSpeed.512000.upload.speed': '512000',
      'menu.DebugLevel.none': 'None',
      'menu.DebugLevel.none.build.code_debug': '0',
      'menu.DebugLevel.error': 'Error',
      'menu.DebugLevel.error.build.code_debug': '1',
      'menu.DebugLevel.warn': 'Warn',
      'menu.DebugLevel.warn.build.code_debug': '2',
      'menu.DebugLevel.info': 'Info',
      'menu.DebugLevel.info.build.code_debug': '3',
      'menu.DebugLevel.debug': 'Debug',
      'menu.DebugLevel.debug.build.code_debug': '4',
      'menu.DebugLevel.verbose': 'Verbose',
      'menu.DebugLevel.verbose.build.code_debug': '5',
      'menu.EraseFlash.none': 'Disabled',
      'menu.EraseFlash.none.upload.erase_cmd': '',
      'menu.EraseFlash.all': 'Enabled',
      'menu.EraseFlash.all.upload.erase_cmd': '-e',
      'menu.ZigbeeMode.default': 'Disabled',
      'menu.ZigbeeMode.default.build.zigbee_mode': '',
      'menu.ZigbeeMode.default.build.zigbee_libs': '',
      'menu.ZigbeeMode.zczr': 'Zigbee ZCZR (coordinator/router)',
      'menu.ZigbeeMode.zczr.build.zigbee_mode': '-DZIGBEE_MODE_ZCZR',
      'menu.ZigbeeMode.zczr.build.zigbee_libs':
        '-lesp_zb_api_zczr -lesp_zb_cli_command -lzboss_stack.zczr -lzboss_port',
      'monitor_port.serial.dtr': 'on',
      'monitor_port.serial.rts': 'on',
      _id: 'esp32c3',
      'build.fqbn': 'esp32:esp32:esp32c3',
      'build.arch': 'ESP32',
      'build.cdc_on_boot': '0',
      'build.partitions': 'default',
      'upload.erase_cmd': '',
      'build.copy_jtag_files': '0',
      'build.flash_mode': 'dio',
      'build.boot': 'qio',
      'build.flash_freq': '80m',
      'build.zigbee_mode': '',
      'build.zigbee_libs': '',
      'build.f_cpu': '160000000L',
      'build.code_debug': '0',
      'build.flash_size': '4MB',
      'upload.speed': '921600',
      'runtime.platform.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1',
      'runtime.hardware.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32',
      'build.board.platform.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1',
      'build.core.platform.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1',
      'build.core.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/cores/esp32',
      'build.system.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/system',
      'build.variant.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/variants/esp32c3',
      'runtime.tools.dfu-util.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/dfu-util/0.11.0-arduino5',
      'runtime.tools.dfu-util-0.11.0-arduino5.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/dfu-util/0.11.0-arduino5',
      'runtime.tools.esp-rv32.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-rv32/2405',
      'runtime.tools.esp-rv32-2405.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-rv32/2405',
      'runtime.tools.esp-x32.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-x32/2405',
      'runtime.tools.esp-x32-2405.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-x32/2405',
      'runtime.tools.esp32-arduino-libs.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1',
      'runtime.tools.esp32-arduino-libs-idf-release_v5.3-cfea4f7c-v1.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1',
      'runtime.tools.esptool_py.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esptool_py/4.9.dev3',
      'runtime.tools.esptool_py-4.9.dev3.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esptool_py/4.9.dev3',
      'runtime.tools.mklittlefs.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/mklittlefs/3.0.0-gnu12-dc7f933',
      'runtime.tools.mklittlefs-3.0.0-gnu12-dc7f933.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/mklittlefs/3.0.0-gnu12-dc7f933',
      'runtime.tools.mkspiffs.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/mkspiffs/0.2.3',
      'runtime.tools.mkspiffs-0.2.3.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/mkspiffs/0.2.3',
      'runtime.tools.openocd-esp32.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/openocd-esp32/v0.12.0-esp32-20241016',
      'runtime.tools.openocd-esp32-v0.12.0-esp32-20241016.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/openocd-esp32/v0.12.0-esp32-20241016',
      'runtime.tools.riscv32-esp-elf-gdb.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/riscv32-esp-elf-gdb/14.2_20240403',
      'runtime.tools.riscv32-esp-elf-gdb-14.2_20240403.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/riscv32-esp-elf-gdb/14.2_20240403',
      'runtime.tools.xtensa-esp-elf-gdb.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/xtensa-esp-elf-gdb/14.2_20240403',
      'runtime.tools.xtensa-esp-elf-gdb-14.2_20240403.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/xtensa-esp-elf-gdb/14.2_20240403',
      'runtime.tools.mdns-discovery.path':
        '/Users/kittaakos/Library/Arduino15/packages/builtin/tools/mdns-discovery/1.0.9',
      'runtime.tools.mdns-discovery-1.0.9.path':
        '/Users/kittaakos/Library/Arduino15/packages/builtin/tools/mdns-discovery/1.0.9',
      'runtime.tools.serial-monitor.path':
        '/Users/kittaakos/Library/Arduino15/packages/builtin/tools/serial-monitor/0.14.1',
      'runtime.tools.serial-monitor-0.14.1.path':
        '/Users/kittaakos/Library/Arduino15/packages/builtin/tools/serial-monitor/0.14.1',
      'runtime.tools.avrdude.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/avrdude/6.3.0-arduino17',
      'runtime.tools.avrdude-6.3.0-arduino17.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/avrdude/6.3.0-arduino17',
      'runtime.tools.ctags.path':
        '/Users/kittaakos/Library/Arduino15/packages/builtin/tools/ctags/5.8-arduino11',
      'runtime.tools.ctags-5.8-arduino11.path':
        '/Users/kittaakos/Library/Arduino15/packages/builtin/tools/ctags/5.8-arduino11',
      'runtime.tools.dfu-discovery.path':
        '/Users/kittaakos/Library/Arduino15/packages/builtin/tools/dfu-discovery/0.1.2',
      'runtime.tools.dfu-discovery-0.1.2.path':
        '/Users/kittaakos/Library/Arduino15/packages/builtin/tools/dfu-discovery/0.1.2',
      'runtime.tools.openocd.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/openocd/0.11.0-arduino2',
      'runtime.tools.openocd-0.11.0-arduino2.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/openocd/0.11.0-arduino2',
      'runtime.tools.bossac.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/bossac/1.9.1-arduino5',
      'runtime.tools.bossac-1.9.1-arduino5.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/bossac/1.9.1-arduino5',
      'runtime.tools.arduinoOTA.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/arduinoOTA/1.3.0',
      'runtime.tools.arduinoOTA-1.3.0.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/arduinoOTA/1.3.0',
      'runtime.tools.serial-discovery.path':
        '/Users/kittaakos/Library/Arduino15/packages/builtin/tools/serial-discovery/1.4.1',
      'runtime.tools.serial-discovery-1.4.1.path':
        '/Users/kittaakos/Library/Arduino15/packages/builtin/tools/serial-discovery/1.4.1',
      'runtime.tools.arm-none-eabi-gcc.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/arm-none-eabi-gcc/7-2017q4',
      'runtime.tools.arm-none-eabi-gcc-7-2017q4.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/arm-none-eabi-gcc/7-2017q4',
      'runtime.tools.avr-gcc.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/avr-gcc/7.3.0-atmel3.6.1-arduino7',
      'runtime.tools.avr-gcc-7.3.0-atmel3.6.1-arduino7.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/avr-gcc/7.3.0-atmel3.6.1-arduino7',
      'extra.time.utc': '1740575986',
      'extra.time.local': '1740579586',
      'extra.time.zone': '3600',
      'extra.time.dst': '0',
      'runtime.ide.path':
        '/Applications/Arduino IDE.app/Contents/Resources/app/lib/backend/resources',
      'runtime.os': 'macosx',
      'build.library_discovery_phase': '0',
      'tools.avrdude.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/avrdude/6.3.0-arduino17',
      ide_version: '10607',
      'runtime.ide.version': '10607',
      software: 'ARDUINO',
    },
    configOptions: [
      {
        optionLabel: 'Upload Speed',
        option: 'UploadSpeed',
        values: [
          { selected: true, value: '921600', valueLabel: '921600' },
          { selected: false, value: '115200', valueLabel: '115200' },
          { selected: false, value: '230400', valueLabel: '230400' },
          { selected: false, value: '460800', valueLabel: '460800' },
        ],
      },
      {
        optionLabel: 'USB CDC On Boot',
        option: 'CDCOnBoot',
        values: [
          { selected: true, value: 'default', valueLabel: 'Disabled' },
          { selected: false, value: 'cdc', valueLabel: 'Enabled' },
        ],
      },
      {
        optionLabel: 'CPU Frequency',
        option: 'CPUFreq',
        values: [
          { selected: true, value: '160', valueLabel: '160MHz (WiFi)' },
          { selected: false, value: '80', valueLabel: '80MHz (WiFi)' },
          { selected: false, value: '40', valueLabel: '40MHz' },
          { selected: false, value: '20', valueLabel: '20MHz' },
          { selected: false, value: '10', valueLabel: '10MHz' },
        ],
      },
      {
        optionLabel: 'Flash Frequency',
        option: 'FlashFreq',
        values: [
          { selected: true, value: '80', valueLabel: '80MHz' },
          { selected: false, value: '40', valueLabel: '40MHz' },
        ],
      },
      {
        optionLabel: 'Flash Mode',
        option: 'FlashMode',
        values: [
          { selected: true, value: 'qio', valueLabel: 'QIO' },
          { selected: false, value: 'dio', valueLabel: 'DIO' },
        ],
      },
      {
        optionLabel: 'Flash Size',
        option: 'FlashSize',
        values: [
          { selected: true, value: '4M', valueLabel: '4MB (32Mb)' },
          { selected: false, value: '8M', valueLabel: '8MB (64Mb)' },
          { selected: false, value: '2M', valueLabel: '2MB (16Mb)' },
          { selected: false, value: '16M', valueLabel: '16MB (128Mb)' },
        ],
      },
      {
        optionLabel: 'Partition Scheme',
        option: 'PartitionScheme',
        values: [
          {
            selected: true,
            value: 'default',
            valueLabel: 'Default 4MB with spiffs (1.2MB APP/1.5MB SPIFFS)',
          },
          {
            selected: false,
            value: 'defaultffat',
            valueLabel: 'Default 4MB with ffat (1.2MB APP/1.5MB FATFS)',
          },
          {
            selected: false,
            value: 'default_8MB',
            valueLabel: '8M with spiffs (3MB APP/1.5MB SPIFFS)',
          },
          {
            selected: false,
            value: 'minimal',
            valueLabel: 'Minimal (1.3MB APP/700KB SPIFFS)',
          },
          {
            selected: false,
            value: 'no_fs',
            valueLabel: 'No FS 4MB (2MB APP x2)',
          },
          {
            selected: false,
            value: 'no_ota',
            valueLabel: 'No OTA (2MB APP/2MB SPIFFS)',
          },
          {
            selected: false,
            value: 'noota_3g',
            valueLabel: 'No OTA (1MB APP/3MB SPIFFS)',
          },
          {
            selected: false,
            value: 'noota_ffat',
            valueLabel: 'No OTA (2MB APP/2MB FATFS)',
          },
          {
            selected: false,
            value: 'noota_3gffat',
            valueLabel: 'No OTA (1MB APP/3MB FATFS)',
          },
          {
            selected: false,
            value: 'huge_app',
            valueLabel: 'Huge APP (3MB No OTA/1MB SPIFFS)',
          },
          {
            selected: false,
            value: 'min_spiffs',
            valueLabel: 'Minimal SPIFFS (1.9MB APP with OTA/190KB SPIFFS)',
          },
          {
            selected: false,
            value: 'fatflash',
            valueLabel: '16M Flash (2MB APP/12.5MB FATFS)',
          },
          {
            selected: false,
            value: 'app3M_fat9M_16MB',
            valueLabel: '16M Flash (3MB APP/9.9MB FATFS)',
          },
          { selected: false, value: 'rainmaker', valueLabel: 'RainMaker 4MB' },
          {
            selected: false,
            value: 'rainmaker_4MB',
            valueLabel: 'RainMaker 4MB No OTA',
          },
          {
            selected: false,
            value: 'rainmaker_8MB',
            valueLabel: 'RainMaker 8MB',
          },
          {
            selected: false,
            value: 'zigbee_zczr',
            valueLabel: 'Zigbee ZCZR 4MB with spiffs',
          },
          { selected: false, value: 'custom', valueLabel: 'Custom' },
        ],
      },
      {
        optionLabel: 'Core Debug Level',
        option: 'DebugLevel',
        values: [
          { selected: true, value: 'none', valueLabel: 'None' },
          { selected: false, value: 'error', valueLabel: 'Error' },
          { selected: false, value: 'warn', valueLabel: 'Warn' },
          { selected: false, value: 'info', valueLabel: 'Info' },
          { selected: false, value: 'debug', valueLabel: 'Debug' },
          { selected: false, value: 'verbose', valueLabel: 'Verbose' },
        ],
      },
      {
        optionLabel: 'Erase All Flash Before Sketch Upload',
        option: 'EraseFlash',
        values: [
          { selected: true, value: 'none', valueLabel: 'Disabled' },
          { selected: false, value: 'all', valueLabel: 'Enabled' },
        ],
      },
      {
        optionLabel: 'JTAG Adapter',
        option: 'JTAGAdapter',
        values: [
          { selected: true, value: 'default', valueLabel: 'Disabled' },
          {
            selected: false,
            value: 'builtin',
            valueLabel: 'Integrated USB JTAG',
          },
          { selected: false, value: 'external', valueLabel: 'FTDI Adapter' },
          { selected: false, value: 'bridge', valueLabel: 'ESP USB Bridge' },
        ],
      },
      {
        optionLabel: 'Zigbee Mode',
        option: 'ZigbeeMode',
        values: [
          { selected: true, value: 'default', valueLabel: 'Disabled' },
          {
            selected: false,
            value: 'zczr',
            valueLabel: 'Zigbee ZCZR (coordinator/router)',
          },
        ],
      },
    ],
    fqbn: 'esp32:esp32:esp32c3',
    programmers: [
      { id: 'esptool', name: 'Esptool', platform: 'esp32:esp32@3.1.1' },
    ],
    toolsDependencies: [
      { name: 'dfu-util', packager: 'arduino', version: '0.11.0-arduino5' },
      { name: 'esp-rv32', packager: 'esp32', version: '2405' },
      { name: 'esp-x32', packager: 'esp32', version: '2405' },
      {
        name: 'esp32-arduino-libs',
        packager: 'esp32',
        version: 'idf-release_v5.3-cfea4f7c-v1',
      },
      { name: 'esptool_py', packager: 'esp32', version: '4.9.dev3' },
      { name: 'mklittlefs', packager: 'esp32', version: '3.0.0-gnu12-dc7f933' },
      { name: 'mkspiffs', packager: 'esp32', version: '0.2.3' },
      {
        name: 'openocd-esp32',
        packager: 'esp32',
        version: 'v0.12.0-esp32-20241016',
      },
      {
        name: 'riscv32-esp-elf-gdb',
        packager: 'esp32',
        version: '14.2_20240403',
      },
      {
        name: 'xtensa-esp-elf-gdb',
        packager: 'esp32',
        version: '14.2_20240403',
      },
    ],
  },
  port: {
    label: '/dev/cu.usbmodem1101',
    address: '/dev/cu.usbmodem1101',
    hardwareId: 'EC:DA:3B:BD:4B:F0',
    properties: {
      pid: '0x1001',
      serialNumber: 'EC:DA:3B:BD:4B:F0',
      vid: '0x303A',
    },
    protocol: 'serial',
    protocolLabel: 'Serial Port (USB)',
  },
  compileSummary: {
    boardPlatform: undefined, // TODO: fix in vscode-arudino-api
    buildPath:
      '/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8',
    buildProperties: {
      _id: 'esp32c3',
      'bootloader.tool': 'esptool_py',
      'bootloader.tool.default': 'esptool_py',
      'build.arch': 'ESP32',
      'build.board': 'ESP32C3_DEV',
      'build.board.platform.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1',
      'build.boot': 'qio',
      'build.boot_freq': '80m',
      'build.bootloader_addr': '0x0',
      'build.cdc_on_boot': '0',
      'build.code_debug': '0',
      'build.copy_jtag_files': '0',
      'build.core': 'esp32',
      'build.core.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/cores/esp32',
      'build.core.platform.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1',
      'build.custom_bootloader': 'bootloader',
      'build.custom_partitions': 'partitions',
      'build.defines': '',
      'build.event_core': '',
      'build.extra_flags':
        '-DARDUINO_HOST_OS="macosx" -DARDUINO_FQBN="esp32:esp32:esp32c3:UploadSpeed=921600,CDCOnBoot=default,CPUFreq=160,FlashFreq=80,FlashMode=qio,FlashSize=4M,PartitionScheme=default,DebugLevel=none,EraseFlash=none,JTAGAdapter=default,ZigbeeMode=default" -DESP32=ESP32 -DCORE_DEBUG_LEVEL=0    -DARDUINO_USB_MODE=1 -DARDUINO_USB_CDC_ON_BOOT=0 ',
      'build.extra_flags.esp32': '-DARDUINO_USB_CDC_ON_BOOT=0',
      'build.extra_flags.esp32c2': '-DARDUINO_USB_CDC_ON_BOOT=0',
      'build.extra_flags.esp32c3':
        '-DARDUINO_USB_MODE=1 -DARDUINO_USB_CDC_ON_BOOT=0',
      'build.extra_flags.esp32c6':
        '-DARDUINO_USB_MODE=1 -DARDUINO_USB_CDC_ON_BOOT=0',
      'build.extra_flags.esp32h2':
        '-DARDUINO_USB_MODE=1 -DARDUINO_USB_CDC_ON_BOOT=0',
      'build.extra_flags.esp32p4':
        '-DARDUINO_USB_MODE={build.usb_mode} -DARDUINO_USB_CDC_ON_BOOT=0 -DARDUINO_USB_MSC_ON_BOOT={build.msc_on_boot} -DARDUINO_USB_DFU_ON_BOOT={build.dfu_on_boot}',
      'build.extra_flags.esp32s2':
        '-DARDUINO_USB_MODE=0 -DARDUINO_USB_CDC_ON_BOOT=0 -DARDUINO_USB_MSC_ON_BOOT={build.msc_on_boot} -DARDUINO_USB_DFU_ON_BOOT={build.dfu_on_boot}',
      'build.extra_flags.esp32s3':
        '-DARDUINO_USB_MODE={build.usb_mode} -DARDUINO_USB_CDC_ON_BOOT=0 -DARDUINO_USB_MSC_ON_BOOT={build.msc_on_boot} -DARDUINO_USB_DFU_ON_BOOT={build.dfu_on_boot}',
      'build.extra_libs': '',
      'build.f_cpu': '160000000L',
      'build.flash_freq': '80m',
      'build.flash_mode': 'dio',
      'build.flash_size': '4MB',
      'build.fqbn':
        'esp32:esp32:esp32c3:UploadSpeed=921600,CDCOnBoot=default,CPUFreq=160,FlashFreq=80,FlashMode=qio,FlashSize=4M,PartitionScheme=default,DebugLevel=none,EraseFlash=none,JTAGAdapter=default,ZigbeeMode=default',
      'build.img_freq': '80m',
      'build.library_discovery_phase': '0',
      'build.loop_core': '',
      'build.mcu': 'esp32c3',
      'build.memory_type': 'qio_qspi',
      'build.opt.name': 'build_opt.h',
      'build.opt.path':
        '/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/build_opt.h',
      'build.partitions': 'default',
      'build.path':
        '/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8',
      'build.project_name': 'riscv_1.ino',
      'build.source.path': '/Users/kittaakos/Documents/Arduino/riscv_1',
      'build.system.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/system',
      'build.tarch': 'riscv32',
      'build.target': 'esp',
      'build.variant': 'esp32c3',
      'build.variant.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/variants/esp32c3',
      'build.zigbee_libs': '',
      'build.zigbee_mode': '',
      'compiler.S.cmd': 'riscv32-esp-elf-gcc',
      'compiler.S.extra_flags': '',
      'compiler.S.flags':
        '-MMD -c -x assembler-with-cpp "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/S_flags" -w -Os',
      'compiler.ar.cmd': 'riscv32-esp-elf-gcc-ar',
      'compiler.ar.extra_flags': '',
      'compiler.ar.flags': 'cr',
      'compiler.as.cmd': 'riscv32-esp-elf-as',
      'compiler.c.cmd': 'riscv32-esp-elf-gcc',
      'compiler.c.elf.cmd': 'riscv32-esp-elf-g++',
      'compiler.c.elf.extra_flags': '',
      'compiler.c.elf.flags':
        '"-Wl,--Map=/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/riscv_1.ino.map" "-L/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/lib" "-L/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/ld" "-L/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/qio_qspi" "-Wl,--wrap=esp_panic_handler" "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/ld_flags" "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/ld_scripts"',
      'compiler.c.elf.libs':
        '"@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/ld_libs"',
      'compiler.c.extra_flags': '',
      'compiler.c.flags':
        '-MMD -c "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/c_flags" -w -Os -Werror=return-type',
      'compiler.common_werror_flags': '-Werror=return-type',
      'compiler.cpp.cmd': 'riscv32-esp-elf-g++',
      'compiler.cpp.extra_flags': '',
      'compiler.cpp.flags':
        '-MMD -c "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/cpp_flags" -w -Os -Werror=return-type',
      'compiler.cpreprocessor.flags':
        '"@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/defines" "-I/Users/kittaakos/Documents/Arduino/riscv_1" -iprefix "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/include/" "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/includes" "-I/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/qio_qspi/include"',
      'compiler.elf2hex.extra_flags': '',
      'compiler.libraries.ldflags': '',
      'compiler.objcopy.eep.extra_flags': '',
      'compiler.optimization_flags': '-Os',
      'compiler.optimization_flags.debug': '-Og -g3',
      'compiler.optimization_flags.release': '-Os',
      'compiler.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-rv32/2405/bin/',
      'compiler.prefix': 'riscv32-esp-elf-',
      'compiler.sdk.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3',
      'compiler.sdk.path.windows':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1\\esp32c3',
      'compiler.size.cmd': 'riscv32-esp-elf-size',
      'compiler.warning_flags': '-w',
      'compiler.warning_flags.all': '-Wall -Wextra',
      'compiler.warning_flags.default': '',
      'compiler.warning_flags.more': '-Wall',
      'compiler.warning_flags.none': '-w',
      'debug.additional_config': 'debug_config.esp32c3',
      'debug.cortex-debug.custom.objdumpPath':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-rv32/2405/bin/riscv32-esp-elf-objdump',
      'debug.cortex-debug.custom.request': 'attach',
      'debug.executable':
        '/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/riscv_1.ino.elf',
      'debug.server': 'openocd',
      'debug.server.openocd.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/openocd-esp32/v0.12.0-esp32-20241016/bin/openocd',
      'debug.server.openocd.scripts.0': 'board/esp32c3-builtin.cfg',
      'debug.server.openocd.scripts_dir':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/openocd-esp32/v0.12.0-esp32-20241016/share/openocd/scripts/',
      'debug.server.openocd.scripts_dir.windows':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/openocd-esp32/v0.12.0-esp32-20241016\\share\\openocd\\scripts\\',
      'debug.svd_file':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/tools/ide-debug/svd/esp32c3.svd',
      'debug.toolchain': 'gcc',
      'debug.toolchain.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/riscv32-esp-elf-gdb/14.2_20240403/bin/',
      'debug.toolchain.prefix': 'riscv32-esp-elf',
      'debug_config.esp32.cortex-debug.custom.name': 'Arduino on ESP32',
      'debug_config.esp32.cortex-debug.custom.overrideRestartCommands.0':
        'monitor reset halt',
      'debug_config.esp32.cortex-debug.custom.overrideRestartCommands.1':
        'monitor gdb_sync',
      'debug_config.esp32.cortex-debug.custom.overrideRestartCommands.2':
        'thb setup',
      'debug_config.esp32.cortex-debug.custom.overrideRestartCommands.3': 'c',
      'debug_config.esp32.cortex-debug.custom.postAttachCommands.0':
        'set remote hardware-watchpoint-limit 2',
      'debug_config.esp32.cortex-debug.custom.postAttachCommands.1':
        'monitor reset halt',
      'debug_config.esp32.cortex-debug.custom.postAttachCommands.2':
        'monitor gdb_sync',
      'debug_config.esp32.cortex-debug.custom.postAttachCommands.3':
        'thb setup',
      'debug_config.esp32.cortex-debug.custom.postAttachCommands.4': 'c',
      'debug_config.esp32c3.cortex-debug.custom.name': 'Arduino on ESP32-C3',
      'debug_config.esp32c3.cortex-debug.custom.overrideAttachCommands.0':
        'set remote hardware-watchpoint-limit 8',
      'debug_config.esp32c3.cortex-debug.custom.overrideAttachCommands.1':
        'monitor reset',
      'debug_config.esp32c3.cortex-debug.custom.overrideAttachCommands.2':
        'monitor halt',
      'debug_config.esp32c3.cortex-debug.custom.overrideAttachCommands.3':
        'monitor gdb_sync',
      'debug_config.esp32c3.cortex-debug.custom.overrideAttachCommands.4':
        'thb setup',
      'debug_config.esp32c3.cortex-debug.custom.overrideRestartCommands.0':
        'monitor reset',
      'debug_config.esp32c3.cortex-debug.custom.overrideRestartCommands.1':
        'monitor halt',
      'debug_config.esp32c3.cortex-debug.custom.overrideRestartCommands.2':
        'monitor gdb_sync',
      'debug_config.esp32c3.cortex-debug.custom.overrideRestartCommands.3':
        'thb setup',
      'debug_config.esp32c3.cortex-debug.custom.serverArgs.0': '-d3',
      'debug_config.esp32c6': '',
      'debug_config.esp32h2': '',
      'debug_config.esp32s2.cortex-debug.custom.name': 'Arduino on ESP32-S2',
      'debug_config.esp32s2.cortex-debug.custom.overrideRestartCommands.0':
        'monitor reset halt',
      'debug_config.esp32s2.cortex-debug.custom.overrideRestartCommands.1':
        'monitor gdb_sync',
      'debug_config.esp32s2.cortex-debug.custom.overrideRestartCommands.2':
        'thb setup',
      'debug_config.esp32s2.cortex-debug.custom.overrideRestartCommands.3': 'c',
      'debug_config.esp32s2.cortex-debug.custom.postAttachCommands.0':
        'set remote hardware-watchpoint-limit 2',
      'debug_config.esp32s2.cortex-debug.custom.postAttachCommands.1':
        'monitor reset halt',
      'debug_config.esp32s2.cortex-debug.custom.postAttachCommands.2':
        'monitor gdb_sync',
      'debug_config.esp32s2.cortex-debug.custom.postAttachCommands.3':
        'thb setup',
      'debug_config.esp32s2.cortex-debug.custom.postAttachCommands.4': 'c',
      'debug_config.esp32s3.cortex-debug.custom.name': 'Arduino on ESP32-S3',
      'debug_config.esp32s3.cortex-debug.custom.overrideAttachCommands.0':
        'set remote hardware-watchpoint-limit 2',
      'debug_config.esp32s3.cortex-debug.custom.overrideAttachCommands.1':
        'monitor reset halt',
      'debug_config.esp32s3.cortex-debug.custom.overrideAttachCommands.2':
        'monitor gdb_sync',
      'debug_config.esp32s3.cortex-debug.custom.overrideAttachCommands.3':
        'thb setup',
      'debug_config.esp32s3.cortex-debug.custom.overrideAttachCommands.4': 'c',
      'debug_config.esp32s3.cortex-debug.custom.overrideRestartCommands.0':
        'monitor reset halt',
      'debug_config.esp32s3.cortex-debug.custom.overrideRestartCommands.1':
        'monitor gdb_sync',
      'debug_script.esp32': 'esp32-wrover-kit-3.3v.cfg',
      'debug_script.esp32c3': 'esp32c3-builtin.cfg',
      'debug_script.esp32c6': 'esp32c6-builtin.cfg',
      'debug_script.esp32h2': 'esp32h2-builtin.cfg',
      'debug_script.esp32s2': 'esp32s2-kaluga-1.cfg',
      'debug_script.esp32s3': 'esp32s3-builtin.cfg',
      'extra.time.dst': '0',
      'extra.time.local': '1740579612',
      'extra.time.utc': '1740576012',
      'extra.time.zone': '3600',
      'file_opts.path':
        '/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/file_opts',
      ide_version: '10607',
      'menu.CDCOnBoot.cdc': 'Enabled',
      'menu.CDCOnBoot.cdc.build.cdc_on_boot': '1',
      'menu.CDCOnBoot.default': 'Disabled',
      'menu.CDCOnBoot.default.build.cdc_on_boot': '0',
      'menu.CPUFreq.10': '10MHz',
      'menu.CPUFreq.10.build.f_cpu': '10000000L',
      'menu.CPUFreq.160': '160MHz (WiFi)',
      'menu.CPUFreq.160.build.f_cpu': '160000000L',
      'menu.CPUFreq.20': '20MHz',
      'menu.CPUFreq.20.build.f_cpu': '20000000L',
      'menu.CPUFreq.40': '40MHz',
      'menu.CPUFreq.40.build.f_cpu': '40000000L',
      'menu.CPUFreq.80': '80MHz (WiFi)',
      'menu.CPUFreq.80.build.f_cpu': '80000000L',
      'menu.DebugLevel.debug': 'Debug',
      'menu.DebugLevel.debug.build.code_debug': '4',
      'menu.DebugLevel.error': 'Error',
      'menu.DebugLevel.error.build.code_debug': '1',
      'menu.DebugLevel.info': 'Info',
      'menu.DebugLevel.info.build.code_debug': '3',
      'menu.DebugLevel.none': 'None',
      'menu.DebugLevel.none.build.code_debug': '0',
      'menu.DebugLevel.verbose': 'Verbose',
      'menu.DebugLevel.verbose.build.code_debug': '5',
      'menu.DebugLevel.warn': 'Warn',
      'menu.DebugLevel.warn.build.code_debug': '2',
      'menu.EraseFlash.all': 'Enabled',
      'menu.EraseFlash.all.upload.erase_cmd': '-e',
      'menu.EraseFlash.none': 'Disabled',
      'menu.EraseFlash.none.upload.erase_cmd': '',
      'menu.FlashFreq.40': '40MHz',
      'menu.FlashFreq.40.build.flash_freq': '40m',
      'menu.FlashFreq.80': '80MHz',
      'menu.FlashFreq.80.build.flash_freq': '80m',
      'menu.FlashMode.dio': 'DIO',
      'menu.FlashMode.dio.build.boot': 'dio',
      'menu.FlashMode.dio.build.flash_mode': 'dio',
      'menu.FlashMode.qio': 'QIO',
      'menu.FlashMode.qio.build.boot': 'qio',
      'menu.FlashMode.qio.build.flash_mode': 'dio',
      'menu.FlashSize.16M': '16MB (128Mb)',
      'menu.FlashSize.16M.build.flash_size': '16MB',
      'menu.FlashSize.2M': '2MB (16Mb)',
      'menu.FlashSize.2M.build.flash_size': '2MB',
      'menu.FlashSize.4M': '4MB (32Mb)',
      'menu.FlashSize.4M.build.flash_size': '4MB',
      'menu.FlashSize.8M': '8MB (64Mb)',
      'menu.FlashSize.8M.build.flash_size': '8MB',
      'menu.JTAGAdapter.bridge': 'ESP USB Bridge',
      'menu.JTAGAdapter.bridge.build.copy_jtag_files': '1',
      'menu.JTAGAdapter.bridge.build.openocdscript': 'esp32c3-bridge.cfg',
      'menu.JTAGAdapter.builtin': 'Integrated USB JTAG',
      'menu.JTAGAdapter.builtin.build.copy_jtag_files': '1',
      'menu.JTAGAdapter.builtin.build.openocdscript': 'esp32c3-builtin.cfg',
      'menu.JTAGAdapter.default': 'Disabled',
      'menu.JTAGAdapter.default.build.copy_jtag_files': '0',
      'menu.JTAGAdapter.external': 'FTDI Adapter',
      'menu.JTAGAdapter.external.build.copy_jtag_files': '1',
      'menu.JTAGAdapter.external.build.openocdscript': 'esp32c3-ftdi.cfg',
      'menu.PartitionScheme.app3M_fat9M_16MB':
        '16M Flash (3MB APP/9.9MB FATFS)',
      'menu.PartitionScheme.app3M_fat9M_16MB.build.partitions':
        'app3M_fat9M_16MB',
      'menu.PartitionScheme.app3M_fat9M_16MB.upload.maximum_size': '3145728',
      'menu.PartitionScheme.custom': 'Custom',
      'menu.PartitionScheme.custom.build.partitions': '',
      'menu.PartitionScheme.custom.upload.maximum_size': '16777216',
      'menu.PartitionScheme.default':
        'Default 4MB with spiffs (1.2MB APP/1.5MB SPIFFS)',
      'menu.PartitionScheme.default.build.partitions': 'default',
      'menu.PartitionScheme.default_8MB':
        '8M with spiffs (3MB APP/1.5MB SPIFFS)',
      'menu.PartitionScheme.default_8MB.build.partitions': 'default_8MB',
      'menu.PartitionScheme.default_8MB.upload.maximum_size': '3342336',
      'menu.PartitionScheme.defaultffat':
        'Default 4MB with ffat (1.2MB APP/1.5MB FATFS)',
      'menu.PartitionScheme.defaultffat.build.partitions': 'default_ffat',
      'menu.PartitionScheme.fatflash': '16M Flash (2MB APP/12.5MB FATFS)',
      'menu.PartitionScheme.fatflash.build.partitions': 'ffat',
      'menu.PartitionScheme.fatflash.upload.maximum_size': '2097152',
      'menu.PartitionScheme.huge_app': 'Huge APP (3MB No OTA/1MB SPIFFS)',
      'menu.PartitionScheme.huge_app.build.partitions': 'huge_app',
      'menu.PartitionScheme.huge_app.upload.maximum_size': '3145728',
      'menu.PartitionScheme.min_spiffs':
        'Minimal SPIFFS (1.9MB APP with OTA/190KB SPIFFS)',
      'menu.PartitionScheme.min_spiffs.build.partitions': 'min_spiffs',
      'menu.PartitionScheme.min_spiffs.upload.maximum_size': '1966080',
      'menu.PartitionScheme.minimal': 'Minimal (1.3MB APP/700KB SPIFFS)',
      'menu.PartitionScheme.minimal.build.partitions': 'minimal',
      'menu.PartitionScheme.no_fs': 'No FS 4MB (2MB APP x2)',
      'menu.PartitionScheme.no_fs.build.partitions': 'no_fs',
      'menu.PartitionScheme.no_fs.upload.maximum_size': '2031616',
      'menu.PartitionScheme.no_ota': 'No OTA (2MB APP/2MB SPIFFS)',
      'menu.PartitionScheme.no_ota.build.partitions': 'no_ota',
      'menu.PartitionScheme.no_ota.upload.maximum_size': '2097152',
      'menu.PartitionScheme.noota_3g': 'No OTA (1MB APP/3MB SPIFFS)',
      'menu.PartitionScheme.noota_3g.build.partitions': 'noota_3g',
      'menu.PartitionScheme.noota_3g.upload.maximum_size': '1048576',
      'menu.PartitionScheme.noota_3gffat': 'No OTA (1MB APP/3MB FATFS)',
      'menu.PartitionScheme.noota_3gffat.build.partitions': 'noota_3gffat',
      'menu.PartitionScheme.noota_3gffat.upload.maximum_size': '1048576',
      'menu.PartitionScheme.noota_ffat': 'No OTA (2MB APP/2MB FATFS)',
      'menu.PartitionScheme.noota_ffat.build.partitions': 'noota_ffat',
      'menu.PartitionScheme.noota_ffat.upload.maximum_size': '2097152',
      'menu.PartitionScheme.rainmaker': 'RainMaker 4MB',
      'menu.PartitionScheme.rainmaker.build.partitions': 'rainmaker',
      'menu.PartitionScheme.rainmaker.upload.maximum_size': '1966080',
      'menu.PartitionScheme.rainmaker_4MB': 'RainMaker 4MB No OTA',
      'menu.PartitionScheme.rainmaker_4MB.build.partitions':
        'rainmaker_4MB_no_ota',
      'menu.PartitionScheme.rainmaker_4MB.upload.maximum_size': '4038656',
      'menu.PartitionScheme.rainmaker_8MB': 'RainMaker 8MB',
      'menu.PartitionScheme.rainmaker_8MB.build.partitions': 'rainmaker_8MB',
      'menu.PartitionScheme.rainmaker_8MB.upload.maximum_size': '4116480',
      'menu.PartitionScheme.zigbee_zczr': 'Zigbee ZCZR 4MB with spiffs',
      'menu.PartitionScheme.zigbee_zczr.build.partitions': 'zigbee_zczr',
      'menu.PartitionScheme.zigbee_zczr.upload.maximum_size': '1310720',
      'menu.UploadSpeed.115200': '115200',
      'menu.UploadSpeed.115200.upload.speed': '115200',
      'menu.UploadSpeed.230400': '230400',
      'menu.UploadSpeed.230400.upload.speed': '230400',
      'menu.UploadSpeed.230400.windows.upload.speed': '256000',
      'menu.UploadSpeed.256000.upload.speed': '256000',
      'menu.UploadSpeed.256000.windows': '256000',
      'menu.UploadSpeed.460800': '460800',
      'menu.UploadSpeed.460800.linux': '460800',
      'menu.UploadSpeed.460800.upload.speed': '460800',
      'menu.UploadSpeed.512000.upload.speed': '512000',
      'menu.UploadSpeed.512000.windows': '512000',
      'menu.UploadSpeed.921600': '921600',
      'menu.UploadSpeed.921600.upload.speed': '921600',
      'menu.ZigbeeMode.default': 'Disabled',
      'menu.ZigbeeMode.default.build.zigbee_libs': '',
      'menu.ZigbeeMode.default.build.zigbee_mode': '',
      'menu.ZigbeeMode.zczr': 'Zigbee ZCZR (coordinator/router)',
      'menu.ZigbeeMode.zczr.build.zigbee_libs':
        '-lesp_zb_api_zczr -lesp_zb_cli_command -lzboss_stack.zczr -lzboss_port',
      'menu.ZigbeeMode.zczr.build.zigbee_mode': '-DZIGBEE_MODE_ZCZR',
      'monitor_port.serial.dtr': 'on',
      'monitor_port.serial.rts': 'on',
      name: 'ESP32C3 Dev Module',
      'pluggable_discovery.required.0': 'builtin:serial-discovery',
      'pluggable_discovery.required.1': 'builtin:mdns-discovery',
      'pluggable_monitor.required.serial': 'builtin:serial-monitor',
      'recipe.S.o.pattern':
        '"/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-rv32/2405/bin/riscv32-esp-elf-gcc"  -MMD -c -x assembler-with-cpp "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/S_flags" -w -Os -DF_CPU=160000000L -DARDUINO=10607 -DARDUINO_ESP32C3_DEV -DARDUINO_ARCH_ESP32 -DARDUINO_BOARD="ESP32C3_DEV" -DARDUINO_VARIANT="esp32c3" -DARDUINO_PARTITION_default -DARDUINO_HOST_OS="macosx" -DARDUINO_FQBN="esp32:esp32:esp32c3:UploadSpeed=921600,CDCOnBoot=default,CPUFreq=160,FlashFreq=80,FlashMode=qio,FlashSize=4M,PartitionScheme=default,DebugLevel=none,EraseFlash=none,JTAGAdapter=default,ZigbeeMode=default" -DESP32=ESP32 -DCORE_DEBUG_LEVEL=0    -DARDUINO_USB_MODE=1 -DARDUINO_USB_CDC_ON_BOOT=0  "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/defines" "-I/Users/kittaakos/Documents/Arduino/riscv_1" -iprefix "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/include/" "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/includes" "-I/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/qio_qspi/include" {includes} "@/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/build_opt.h" "@/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/file_opts" "{source_file}" -o "{object_file}"',
      'recipe.ar.pattern':
        '"/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-rv32/2405/bin/riscv32-esp-elf-gcc-ar" cr  "{archive_file_path}" "{object_file}"',
      'recipe.c.combine.pattern':
        '"/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-rv32/2405/bin/riscv32-esp-elf-g++" "-Wl,--Map=/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/riscv_1.ino.map" "-L/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/lib" "-L/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/ld" "-L/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/qio_qspi" "-Wl,--wrap=esp_panic_handler" "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/ld_flags" "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/ld_scripts"  -Wl,--start-group {object_files} "{archive_file_path}"   "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/ld_libs"  -Wl,--end-group -Wl,-EL -o "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/riscv_1.ino.elf"',
      'recipe.c.o.pattern':
        '"/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-rv32/2405/bin/riscv32-esp-elf-gcc"  -MMD -c "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/c_flags" -w -Os -Werror=return-type -DF_CPU=160000000L -DARDUINO=10607 -DARDUINO_ESP32C3_DEV -DARDUINO_ARCH_ESP32 -DARDUINO_BOARD="ESP32C3_DEV" -DARDUINO_VARIANT="esp32c3" -DARDUINO_PARTITION_default -DARDUINO_HOST_OS="macosx" -DARDUINO_FQBN="esp32:esp32:esp32c3:UploadSpeed=921600,CDCOnBoot=default,CPUFreq=160,FlashFreq=80,FlashMode=qio,FlashSize=4M,PartitionScheme=default,DebugLevel=none,EraseFlash=none,JTAGAdapter=default,ZigbeeMode=default" -DESP32=ESP32 -DCORE_DEBUG_LEVEL=0    -DARDUINO_USB_MODE=1 -DARDUINO_USB_CDC_ON_BOOT=0  "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/defines" "-I/Users/kittaakos/Documents/Arduino/riscv_1" -iprefix "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/include/" "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/includes" "-I/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/qio_qspi/include" {includes} "@/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/build_opt.h" "@/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/file_opts" "{source_file}" -o "{object_file}"',
      'recipe.cpp.o.pattern':
        '"/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-rv32/2405/bin/riscv32-esp-elf-g++"  -MMD -c "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/cpp_flags" -w -Os -Werror=return-type -DF_CPU=160000000L -DARDUINO=10607 -DARDUINO_ESP32C3_DEV -DARDUINO_ARCH_ESP32 -DARDUINO_BOARD="ESP32C3_DEV" -DARDUINO_VARIANT="esp32c3" -DARDUINO_PARTITION_default -DARDUINO_HOST_OS="macosx" -DARDUINO_FQBN="esp32:esp32:esp32c3:UploadSpeed=921600,CDCOnBoot=default,CPUFreq=160,FlashFreq=80,FlashMode=qio,FlashSize=4M,PartitionScheme=default,DebugLevel=none,EraseFlash=none,JTAGAdapter=default,ZigbeeMode=default" -DESP32=ESP32 -DCORE_DEBUG_LEVEL=0    -DARDUINO_USB_MODE=1 -DARDUINO_USB_CDC_ON_BOOT=0  "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/defines" "-I/Users/kittaakos/Documents/Arduino/riscv_1" -iprefix "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/include/" "@/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/flags/includes" "-I/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3/qio_qspi/include" {includes} "@/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/build_opt.h" "@/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/file_opts" "{source_file}" -o "{object_file}"',
      'recipe.hooks.core.postbuild.1.pattern':
        '/usr/bin/env bash -c ": > \'/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/file_opts\'"',
      'recipe.hooks.core.postbuild.1.pattern.windows':
        'cmd /c type nul > "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/file_opts"',
      'recipe.hooks.core.prebuild.1.pattern':
        '/usr/bin/env bash -c "echo -DARDUINO_CORE_BUILD > \'/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/file_opts\'"',
      'recipe.hooks.core.prebuild.1.pattern.windows':
        'cmd /c echo "-DARDUINO_CORE_BUILD" > "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/file_opts"',
      'recipe.hooks.objcopy.postobjcopy.1.pattern':
        '/usr/bin/env bash -c "[ ! -d "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8"/libraries/Insights ] || python3 "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1"/tools/gen_insights_package.py /Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8 riscv_1.ino "/Users/kittaakos/Documents/Arduino/riscv_1""',
      'recipe.hooks.objcopy.postobjcopy.1.pattern.windows':
        'cmd /c if exist "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8\\libraries\\Insights" python3 "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1"/tools/gen_insights_package.py /Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8 riscv_1.ino "/Users/kittaakos/Documents/Arduino/riscv_1"',
      'recipe.hooks.objcopy.postobjcopy.1.pattern_args':
        '/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8 riscv_1.ino "/Users/kittaakos/Documents/Arduino/riscv_1"',
      'recipe.hooks.objcopy.postobjcopy.2.pattern':
        '/usr/bin/env bash -c "[ ! -d "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8"/libraries/ESP_SR ] || [ ! -f "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3"/esp_sr/srmodels.bin ] || cp -f "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3"/esp_sr/srmodels.bin "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8"/srmodels.bin"',
      'recipe.hooks.objcopy.postobjcopy.2.pattern.windows':
        'cmd /c if exist "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8\\libraries\\ESP_SR" if exist "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3\\esp_sr\\srmodels.bin" COPY /y "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3\\esp_sr\\srmodels.bin" "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8\\srmodels.bin"',
      'recipe.hooks.objcopy.postobjcopy.3.pattern':
        '"/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esptool_py/4.9.dev3/esptool" --chip esp32c3 merge_bin -o "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/riscv_1.ino.merged.bin" --fill-flash-size 4MB --flash_mode keep --flash_freq keep --flash_size keep 0x0 "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/riscv_1.ino.bootloader.bin" 0x8000 "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/riscv_1.ino.partitions.bin" 0xe000 "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/tools/partitions/boot_app0.bin" 0x10000 "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/riscv_1.ino.bin"',
      'recipe.hooks.objcopy.postobjcopy.3.pattern_args':
        '--chip esp32c3 merge_bin -o "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/riscv_1.ino.merged.bin" --fill-flash-size 4MB --flash_mode keep --flash_freq keep --flash_size keep 0x0 "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/riscv_1.ino.bootloader.bin" 0x8000 "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/riscv_1.ino.partitions.bin" 0xe000 "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/tools/partitions/boot_app0.bin" 0x10000 "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/riscv_1.ino.bin"',
      'recipe.hooks.prebuild.1.pattern':
        '/usr/bin/env bash -c "[ ! -f "/Users/kittaakos/Documents/Arduino/riscv_1"/partitions.csv ] || cp -f "/Users/kittaakos/Documents/Arduino/riscv_1"/partitions.csv "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8"/partitions.csv"',
      'recipe.hooks.prebuild.1.pattern.windows':
        'cmd /c if exist "/Users/kittaakos/Documents/Arduino/riscv_1\\partitions.csv" COPY /y "/Users/kittaakos/Documents/Arduino/riscv_1\\partitions.csv" "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8\\partitions.csv"',
      'recipe.hooks.prebuild.2.pattern':
        '/usr/bin/env bash -c "[ -f "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8"/partitions.csv ] || [ ! -f "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/variants/esp32c3"/partitions.csv ] || cp "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/variants/esp32c3"/partitions.csv "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8"/partitions.csv"',
      'recipe.hooks.prebuild.2.pattern.windows':
        'cmd /c if not exist "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8\\partitions.csv" if exist "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/variants/esp32c3\\partitions.csv" COPY "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/variants/esp32c3\\partitions.csv" "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8\\partitions.csv"',
      'recipe.hooks.prebuild.3.pattern':
        '/usr/bin/env bash -c "[ -f "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8"/partitions.csv ] || cp "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1"/tools/partitions/default.csv "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8"/partitions.csv"',
      'recipe.hooks.prebuild.3.pattern.windows':
        'cmd /c if not exist "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8\\partitions.csv" COPY "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1\\tools\\partitions\\default.csv" "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8\\partitions.csv"',
      'recipe.hooks.prebuild.4.pattern':
        '/usr/bin/env bash -c "[ -f "/Users/kittaakos/Documents/Arduino/riscv_1"/bootloader.bin ] && cp -f "/Users/kittaakos/Documents/Arduino/riscv_1"/bootloader.bin "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8"/riscv_1.ino.bootloader.bin || ( [ -f "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/variants/esp32c3"/bootloader.bin ] && cp "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/variants/esp32c3"/bootloader.bin "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8"/riscv_1.ino.bootloader.bin || "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esptool_py/4.9.dev3"/esptool --chip esp32c3 elf2image --flash_mode dio --flash_freq 80m --flash_size 4MB -o "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8"/riscv_1.ino.bootloader.bin "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3"/bin/bootloader_qio_80m.elf )"',
      'recipe.hooks.prebuild.4.pattern.windows':
        'cmd /c IF EXIST "/Users/kittaakos/Documents/Arduino/riscv_1\\bootloader.bin" ( COPY /y "/Users/kittaakos/Documents/Arduino/riscv_1\\bootloader.bin" "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8\\riscv_1.ino.bootloader.bin" ) ELSE ( IF EXIST "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/variants/esp32c3\\bootloader.bin" ( COPY "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/variants/esp32c3\\bootloader.bin" "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8\\riscv_1.ino.bootloader.bin" ) ELSE ( "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esptool_py/4.9.dev3\\esptool" --chip esp32c3 elf2image --flash_mode dio --flash_freq 80m --flash_size 4MB -o "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8\\riscv_1.ino.bootloader.bin" "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3\\bin\\bootloader_qio_80m.elf" ) )',
      'recipe.hooks.prebuild.4.pattern_args':
        '--chip esp32c3 elf2image --flash_mode dio --flash_freq 80m --flash_size 4MB -o',
      'recipe.hooks.prebuild.5.pattern':
        '/usr/bin/env bash -c "[ ! -f "/Users/kittaakos/Documents/Arduino/riscv_1"/build_opt.h ] || cp -f "/Users/kittaakos/Documents/Arduino/riscv_1"/build_opt.h "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8"/build_opt.h"',
      'recipe.hooks.prebuild.5.pattern.windows':
        'cmd /c if exist "/Users/kittaakos/Documents/Arduino/riscv_1\\build_opt.h" COPY /y "/Users/kittaakos/Documents/Arduino/riscv_1\\build_opt.h" "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8\\build_opt.h"',
      'recipe.hooks.prebuild.6.pattern':
        '/usr/bin/env bash -c "[ -f "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8"/build_opt.h ] || : > "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8"/build_opt.h"',
      'recipe.hooks.prebuild.6.pattern.windows':
        'cmd /c if not exist "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8\\build_opt.h" type nul > "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8\\build_opt.h"',
      'recipe.hooks.prebuild.7.pattern':
        '/usr/bin/env bash -c ": > \'/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/file_opts\'"',
      'recipe.hooks.prebuild.7.pattern.windows':
        'cmd /c type nul > "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/file_opts"',
      'recipe.hooks.prebuild.8.pattern':
        '/usr/bin/env bash -c "cp -f "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3"/sdkconfig "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8"/sdkconfig"',
      'recipe.hooks.prebuild.8.pattern.windows':
        'cmd /c COPY /y "/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1/esp32c3\\sdkconfig" "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8\\sdkconfig"',
      'recipe.objcopy.bin.pattern':
        '"/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esptool_py/4.9.dev3/esptool" --chip esp32c3 elf2image --flash_mode "dio" --flash_freq "80m" --flash_size "4MB" --elf-sha256-offset 0xb0 -o "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/riscv_1.ino.bin" "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/riscv_1.ino.elf"',
      'recipe.objcopy.bin.pattern_args':
        '--chip esp32c3 elf2image --flash_mode "dio" --flash_freq "80m" --flash_size "4MB" --elf-sha256-offset 0xb0 -o "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/riscv_1.ino.bin" "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/riscv_1.ino.elf"',
      'recipe.objcopy.partitions.bin.pattern':
        'python3 "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/tools/gen_esp32part.py" -q "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/partitions.csv" "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/riscv_1.ino.partitions.bin"',
      'recipe.output.save_file': 'riscv_1.ino.esp32c3.bin',
      'recipe.output.tmp_file': 'riscv_1.ino.bin',
      'recipe.size.pattern':
        '"/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-rv32/2405/bin/riscv32-esp-elf-size" -A "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/riscv_1.ino.elf"',
      'recipe.size.regex':
        '^(?:\\.iram0\\.text|\\.iram0\\.vectors|\\.dram0\\.data|\\.dram1\\.data|\\.flash\\.text|\\.flash\\.rodata|\\.flash\\.appdesc|\\.flash\\.init_array|\\.eh_frame|)\\s+([0-9]+).*',
      'recipe.size.regex.data':
        '^(?:\\.dram0\\.data|\\.dram0\\.bss|\\.dram1\\.data|\\.dram1\\.bss|\\.noinit)\\s+([0-9]+).*',
      'runtime.hardware.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32',
      'runtime.ide.path':
        '/Applications/Arduino IDE.app/Contents/Resources/app/lib/backend/resources',
      'runtime.ide.version': '10607',
      'runtime.os': 'macosx',
      'runtime.platform.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1',
      'runtime.tools.arduinoOTA-1.3.0.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/arduinoOTA/1.3.0',
      'runtime.tools.arduinoOTA.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/arduinoOTA/1.3.0',
      'runtime.tools.arm-none-eabi-gcc-7-2017q4.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/arm-none-eabi-gcc/7-2017q4',
      'runtime.tools.arm-none-eabi-gcc.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/arm-none-eabi-gcc/7-2017q4',
      'runtime.tools.avr-gcc-7.3.0-atmel3.6.1-arduino7.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/avr-gcc/7.3.0-atmel3.6.1-arduino7',
      'runtime.tools.avr-gcc.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/avr-gcc/7.3.0-atmel3.6.1-arduino7',
      'runtime.tools.avrdude-6.3.0-arduino17.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/avrdude/6.3.0-arduino17',
      'runtime.tools.avrdude.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/avrdude/6.3.0-arduino17',
      'runtime.tools.bossac-1.9.1-arduino5.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/bossac/1.9.1-arduino5',
      'runtime.tools.bossac.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/bossac/1.9.1-arduino5',
      'runtime.tools.ctags-5.8-arduino11.path':
        '/Users/kittaakos/Library/Arduino15/packages/builtin/tools/ctags/5.8-arduino11',
      'runtime.tools.ctags.path':
        '/Users/kittaakos/Library/Arduino15/packages/builtin/tools/ctags/5.8-arduino11',
      'runtime.tools.dfu-discovery-0.1.2.path':
        '/Users/kittaakos/Library/Arduino15/packages/builtin/tools/dfu-discovery/0.1.2',
      'runtime.tools.dfu-discovery.path':
        '/Users/kittaakos/Library/Arduino15/packages/builtin/tools/dfu-discovery/0.1.2',
      'runtime.tools.dfu-util-0.11.0-arduino5.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/dfu-util/0.11.0-arduino5',
      'runtime.tools.dfu-util.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/dfu-util/0.11.0-arduino5',
      'runtime.tools.esp-rv32-2405.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-rv32/2405',
      'runtime.tools.esp-rv32.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-rv32/2405',
      'runtime.tools.esp-x32-2405.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-x32/2405',
      'runtime.tools.esp-x32.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-x32/2405',
      'runtime.tools.esp32-arduino-libs-idf-release_v5.3-cfea4f7c-v1.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1',
      'runtime.tools.esp32-arduino-libs.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1',
      'runtime.tools.esptool_py-4.9.dev3.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esptool_py/4.9.dev3',
      'runtime.tools.esptool_py.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esptool_py/4.9.dev3',
      'runtime.tools.mdns-discovery-1.0.9.path':
        '/Users/kittaakos/Library/Arduino15/packages/builtin/tools/mdns-discovery/1.0.9',
      'runtime.tools.mdns-discovery.path':
        '/Users/kittaakos/Library/Arduino15/packages/builtin/tools/mdns-discovery/1.0.9',
      'runtime.tools.mklittlefs-3.0.0-gnu12-dc7f933.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/mklittlefs/3.0.0-gnu12-dc7f933',
      'runtime.tools.mklittlefs.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/mklittlefs/3.0.0-gnu12-dc7f933',
      'runtime.tools.mkspiffs-0.2.3.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/mkspiffs/0.2.3',
      'runtime.tools.mkspiffs.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/mkspiffs/0.2.3',
      'runtime.tools.openocd-0.11.0-arduino2.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/openocd/0.11.0-arduino2',
      'runtime.tools.openocd-esp32-v0.12.0-esp32-20241016.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/openocd-esp32/v0.12.0-esp32-20241016',
      'runtime.tools.openocd-esp32.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/openocd-esp32/v0.12.0-esp32-20241016',
      'runtime.tools.openocd.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/openocd/0.11.0-arduino2',
      'runtime.tools.riscv32-esp-elf-gdb-14.2_20240403.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/riscv32-esp-elf-gdb/14.2_20240403',
      'runtime.tools.riscv32-esp-elf-gdb.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/riscv32-esp-elf-gdb/14.2_20240403',
      'runtime.tools.serial-discovery-1.4.1.path':
        '/Users/kittaakos/Library/Arduino15/packages/builtin/tools/serial-discovery/1.4.1',
      'runtime.tools.serial-discovery.path':
        '/Users/kittaakos/Library/Arduino15/packages/builtin/tools/serial-discovery/1.4.1',
      'runtime.tools.serial-monitor-0.14.1.path':
        '/Users/kittaakos/Library/Arduino15/packages/builtin/tools/serial-monitor/0.14.1',
      'runtime.tools.serial-monitor.path':
        '/Users/kittaakos/Library/Arduino15/packages/builtin/tools/serial-monitor/0.14.1',
      'runtime.tools.xtensa-esp-elf-gdb-14.2_20240403.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/xtensa-esp-elf-gdb/14.2_20240403',
      'runtime.tools.xtensa-esp-elf-gdb.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/xtensa-esp-elf-gdb/14.2_20240403',
      'serial.disableDTR': 'false',
      'serial.disableRTS': 'false',
      sketch_path: '/Users/kittaakos/Documents/Arduino/riscv_1',
      software: 'ARDUINO',
      'tools.avrdude.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/avrdude/6.3.0-arduino17',
      'tools.dfu-util.cmd': 'dfu-util',
      'tools.dfu-util.path':
        '/Users/kittaakos/Library/Arduino15/packages/arduino/tools/dfu-util/0.11.0-arduino5',
      'tools.dfu-util.upload.params.quiet': '',
      'tools.dfu-util.upload.params.verbose': '-d',
      'tools.dfu-util.upload.pattern':
        '"{path}/{cmd}" --device {vid.0}:{pid.0} -D "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/riscv_1.ino.bin" -Q',
      'tools.esp32-arduino-libs.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp32-arduino-libs/idf-release_v5.3-cfea4f7c-v1',
      'tools.esp_ota.cmd':
        'python3 "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/tools/espota.py" -r',
      'tools.esp_ota.cmd.windows':
        '"/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1\\tools\\espota.exe" -r',
      'tools.esp_ota.upload.field.password': 'Password',
      'tools.esp_ota.upload.field.password.secret': 'true',
      'tools.esp_ota.upload.pattern':
        '{cmd} -i {upload.port.address} -p {upload.port.properties.port} "--auth={upload.field.password}" -f "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/riscv_1.ino.bin"',
      'tools.esp_ota.upload.protocol': 'network',
      'tools.esptool_py.bootloader.params.quiet': '',
      'tools.esptool_py.bootloader.params.verbose': '',
      'tools.esptool_py.bootloader.pattern': '',
      'tools.esptool_py.bootloader.protocol': 'serial',
      'tools.esptool_py.cmd': 'esptool',
      'tools.esptool_py.cmd.windows': 'esptool.exe',
      'tools.esptool_py.erase.params.quiet': '',
      'tools.esptool_py.erase.params.verbose': '',
      'tools.esptool_py.erase.pattern': '"{path}/{cmd}" {erase.pattern_args}',
      'tools.esptool_py.erase.pattern_args':
        '--chip esp32c3 --port "{serial.port}" --baud 921600  --before default_reset --after hard_reset erase_flash',
      'tools.esptool_py.erase.protocol': 'serial',
      'tools.esptool_py.network_cmd':
        'python3 "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/tools/espota.py" -r',
      'tools.esptool_py.network_cmd.windows':
        '"/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1\\tools\\espota.exe" -r',
      'tools.esptool_py.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esptool_py/4.9.dev3',
      'tools.esptool_py.program.params.quiet': '',
      'tools.esptool_py.program.params.verbose': '',
      'tools.esptool_py.program.pattern':
        '"{path}/{cmd}" {program.pattern_args}',
      'tools.esptool_py.program.pattern_args':
        '--chip esp32c3 --port "{serial.port}" --baud 921600  --before default_reset --after hard_reset write_flash -z --flash_mode keep --flash_freq keep --flash_size keep 0x10000 "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/riscv_1.ino.bin"',
      'tools.esptool_py.upload.network_pattern':
        '{network_cmd} -i "{serial.port}" -p "{network.port}" "--auth={network.password}" -f "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/riscv_1.ino.bin"',
      'tools.esptool_py.upload.params.quiet': '',
      'tools.esptool_py.upload.params.verbose': '',
      'tools.esptool_py.upload.pattern': '"{path}/{cmd}" {upload.pattern_args}',
      'tools.esptool_py.upload.pattern_args':
        '--chip esp32c3 --port "{serial.port}" --baud 921600  --before default_reset --after hard_reset write_flash  -z --flash_mode keep --flash_freq keep --flash_size keep 0x0 "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/riscv_1.ino.bootloader.bin" 0x8000 "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/riscv_1.ino.partitions.bin" 0xe000 "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/tools/partitions/boot_app0.bin" 0x10000 "/Users/kittaakos/Library/Caches/arduino/sketches/E674F2149AEDD8735926954C268E17F8/riscv_1.ino.bin" ',
      'tools.esptool_py.upload.protocol': 'serial',
      'tools.gen_esp32part.cmd':
        'python3 "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1/tools/gen_esp32part.py"',
      'tools.gen_esp32part.cmd.windows':
        '"/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1\\tools\\gen_esp32part.exe"',
      'tools.gen_insights_pkg.cmd':
        'python3 "/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1"/tools/gen_insights_package.py',
      'tools.gen_insights_pkg.cmd.windows':
        '"/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1\\tools\\gen_insights_package.exe"',
      'tools.riscv32-esp-elf-gcc.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-rv32/2405',
      'tools.riscv32-esp-elf-gdb.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/riscv32-esp-elf-gdb/14.2_20240403',
      'tools.xtensa-esp-elf-gcc.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/esp-x32/2405',
      'tools.xtensa-esp-elf-gdb.path':
        '/Users/kittaakos/Library/Arduino15/packages/esp32/tools/xtensa-esp-elf-gdb/14.2_20240403',
      'upload.erase_cmd': '',
      'upload.extra_flags': '',
      'upload.flags': '',
      'upload.maximum_data_size': '327680',
      'upload.maximum_size': '1310720',
      'upload.speed': '921600',
      'upload.tool': 'esptool_py',
      'upload.tool.default': 'esptool_py',
      'upload.tool.network': 'esp_ota',
      'upload.use_1200bps_touch': 'false',
      'upload.wait_for_upload_port': 'false',
      version: '3.1.1',
    },
    executableSectionsSize: [
      { name: 'text', size: 280118, maxSize: 1310720 },
      { name: 'data', size: 11732, maxSize: 327680 },
    ],
    buildPlatform: {
      id: 'esp32:esp32',
      version: '3.1.1',
      installDir:
        '/Users/kittaakos/Library/Arduino15/packages/esp32/hardware/esp32/3.1.1',
      packageUrl: '',
    },
    usedLibraries: [],
  },
};
