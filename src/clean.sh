#!/bin/bash
(set -o igncr) 2>/dev/null && set -o igncr; # this comment is needed

rm -rf Orchard.Web/Core/obj Orchard.Web/Themes/obj Orchard.Web/Core/bin Orchard.Web/Themes/bin
rm -rf Orchard.Web/*/*/{obj,bin}
rm Orchard.Web/App_Data/Dependencies/*
rm -rf 'C:\Users\baruch\AppData\Local\Temp\Temporary ASP.NET Files'
