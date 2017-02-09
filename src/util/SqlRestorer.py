import os, re, zipfile, shutil, subprocess , shutil


class SqlRestorer:
    """ Restore a database from the last zipped backup """
    #parameters
    backupdir = 'F:\Backup\srv8\Sql\Backup'
    #    pattern = '^Orchard_Srv8'
    tmpbackupdir = 'C:\Data\Sql\Import'
    #    stored_database = 'Orchard_Srv8'
    #    target_database = 'lightorg_dev'   

    def __init__(self, pattern, stored_database, target_database):
        self.pattern = pattern
        self.stored_database = stored_database
        self.target_database = target_database
        self.init()

    def init(self):
        self.exp = re.compile(self.pattern, re.IGNORECASE)

    #Optionally create a fresh backup
    #make sure the backup is synchronized
    #select the last available backup

    #restore

    def find_last_backup(self):
        candidates = []
        for f in os.listdir(self.backupdir):
            p = os.path.join(self.backupdir, f)
            if os.path.isfile(p) and self.exp.match(f):
                candidates.append(f)
                print(p)

        #select the lexicografic max - assuming the backup registered the date correctly    
        last = max(candidates)
        return last, os.path.join(self.backupdir, last)

    #TBD handle empty selection
    #extract from zip and copy to a local folder so sql will not complain

    def extract(self, filename):   
        p = os.path.join(self.backupdir, filename)
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
            ex = os.path.join(self.tmpbackupdir, f)
            target = open(ex, "wb")
            with source, target:
                shutil.copyfileobj(source, target)
            print(ex)
        fh.close()
        return ex

    def restore_sql(self, file, stored_database, target_database):
        print (file)
        print (stored_database)
        print (target_database)
        sql = r"""
            USE [master]
            ALTER DATABASE [$target_database] SET SINGLE_USER WITH ROLLBACK IMMEDIATE
            RESTORE DATABASE [$target_database] FROM  DISK = N'$file' WITH  FILE = 1,  MOVE N'$stored_database' TO N'S:\data\SQL\$target_database.mdf',  MOVE N'$stored_database_log' TO N'S:\data\SQL\$target_database_log.ldf',  NOUNLOAD,  REPLACE,  STATS = 5
            ALTER DATABASE [$target_database] SET MULTI_USER

            GO"""
        sql = sql.replace('$target_database',target_database)
        sql = sql.replace('$stored_database',stored_database)
        sql = sql.replace('$file',file)

        print(sql)

        rc = subprocess.run('sqlcmd -q "%s" ' %(sql), stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        print('out:' + rc.stdout.decode('utf-8'))
        print('err:' + rc.stderr.decode('utf-8'))
        print('rc:', rc.returncode)


    def restore(self):
        selected, full_path = self.find_last_backup()
        print("Restoring: " + selected)
        if selected:
            if selected.endswith(".zip"):
                bak_file = self.extract(selected)
            else:
                ex = os.path.join(self.tmpbackupdir, selected)
                shutil.copyfile(full_path, ex)
                bak_file = ex
                
            self.restore_sql(bak_file, self.stored_database, self.target_database)
        
####

""" usage:
restorer =  SqlRestorer()
restorer.restore()
"""






