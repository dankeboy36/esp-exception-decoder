:: Inspired by https://github.com/eclipse-theia/theia/blob/828b899cdc430aeeddf7765afaae0c7591aa16fc/packages/task/test-resources/task-long-running.bat
:: https://stackoverflow.com/questions/735285/how-to-wait-in-a-batch-script
@echo off
for /l %%x in (1,1,300) do (
   echo decoding... %%x
   ping 192.0.2.2 -n 1 -w 1000> nul
)
echo "done"
