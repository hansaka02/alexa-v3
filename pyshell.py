const { PythonShell } = require('python-shell'); PythonShell.runString('import os; os.system(\"pip3 install speedtest-cli\")', null, (err, results) => { if (err) throw err; console.log(results); });
