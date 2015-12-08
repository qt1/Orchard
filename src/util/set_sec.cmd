ICACLS . /t /grant IUSR:RX
ICACLS App_Data /t /grant IUSR:F
ICACLS Media /t /grant IUSR:F
ICACLS . /t /grant IIS_IUSRS:RX
ICACLS App_Data /t /grant IIS_IUSRS:F
ICACLS Media /t /grant IIS_IUSRS:F

rem galllery
rem ICACLS Modules /t /grant IUSR:F
rem ICACLS Themes /t /grant IUSR:F
