import os, re, zipfile, shutil, subprocess 

#parameters
backupdir = 'Z:\Backup\srv8\Sql\Backup'
pattern = '^Orchard_Srv8'
tmpbackupdir = 'C:\Data\Sql\Import'
database = ''

exp = re.compile(pattern, re.IGNORECASE)

#Optionally create a fresh backup

#make sure the backup is synchronized

#select the last available backup


#restore

def find_last_backup(pattern):
    candidates = []
    for f in os.listdir(backupdir):
        p = os.path.join(backupdir, f)
        if os.path.isfile(p) and exp.match(f):
            candidates.append(f)
            print(p)

    #select the lexicografic nax - assuming the backup registered the date correctly    
    return max(candidates)

#TBD handle empty selection

#extract from zip and copy to a local folder so sql will not complain

def extract(filename):
    p = os.path.join(backupdir, filename)
    fh = open(p, 'rb')
    z = zipfile.ZipFile(fh)
    for name in z.namelist():
        print(name)
        f = os.path.basename(name)
        # skip directories
        if not f:
            continue

        # copy file (taken from zipfile's extract)
        source = z.open(name)
        ex = os.path.join(tmpbackupdir, f)
        target = open(ex, "wb")
        with source, target:
            shutil.copyfileobj(source, target)
        print(ex)
    fh.close()
    return ex

def restore_sql(file, stored_database, target_database):
    print (file)
    print (stored_database)
    print (target_database)
    sql = r"""
       USE [master]
       RESTORE DATABASE [%s] FROM  DISK = N'%s' WITH  FILE = 1,  MOVE N'%s' TO N'S:\data\SQL\%s',  MOVE N'Orchard_Srv8_log' TO N'S:\data\SQL\Orchard_Srv8_log.ldf',  NOUNLOAD,  STATS = 5

       GO""" % (target_database, file, stored_database, target_database)

    print(sql)

    rc = subprocess.run('sqlcmd -q "%s" ' %(sql), stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    print('out:' + rc.stdout.decode('utf-8'))
    print('err:' + rc.stderr.decode('utf-8'))
    print('rc:', rc.returncode)


selected = find_last_backup(pattern)
print(selected)
if selected:
    bak_file = extract(selected)
    restore_sql(bak_file, 'Orchard_Srv8', 'Orchard_Srv8')
    







