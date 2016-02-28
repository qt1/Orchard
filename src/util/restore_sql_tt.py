from SqlRestorer import SqlRestorer


restorer =  SqlRestorer('^tt_orchard_srv8_.*[^l][^o][^g].BAK.zip$', 'tt_orchard_srv8', 'tt_orchard_dev')
restorer.restore()








