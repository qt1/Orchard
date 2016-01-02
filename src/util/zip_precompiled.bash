(set -o igncr) 2>/dev/null && set -o igncr; # this comment is needed
name=precomplied_`date +%F`.`git rev-parse --abbrev-ref HEAD`.`git rev-parse HEAD`
cd build
mv Precompiled $name
zip -rm9 $name.zip $name