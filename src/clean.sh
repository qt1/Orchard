#!/bin/bash
(set -o igncr) 2>/dev/null && set -o igncr; # this comment is needed

rm -rf Orchard.Web/Core/obj Orchard.Web/Themes/obj Orchard.Web/Core/bin Orchard.Web/Themes/bin
rm -rf Orchard.Web/*/*/{obj,bin}
rm Orchard.Web/App_Data/Dependencies/*
rm Orchard.Web/App_Data/cache.dat
rm Orchard.Web/App_Data/Sites/*/mappings.bin

rm "$(cygpath $LOCALAPPDATA)/TEMP/Temporary ASP.NET Files"
