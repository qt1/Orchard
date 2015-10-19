#!/bin/bash
(set -o igncr) 2>/dev/null && set -o igncr; # this comment is needed

find . \( -name bin -or -name obj \) -type d -exec echo '{}' '&&' rm -rf '{}' \;
 
rm Orchard.Web/App_Data/Dependencies/*
rm Orchard.Web/App_Data/cache.dat
rm Orchard.Web/App_Data/Sites/*/mappings.bin

rm -rf "$(cygpath $LOCALAPPDATA)/TEMP/Temporary ASP.NET Files"
