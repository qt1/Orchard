# Scan all csproj files and check the references

import fnmatch
import os
import xml
import xml.etree.ElementTree

base_path = "../.."

allRefs = []
matches = []
refs_by_file = {}
references = []
by_name = {}

######################################

class Ref:
    ''' a library reference '''
    ''' Include="FluentNHibernate, Version=1.0.0.0, Culture=neutral, PublicKeyToken=8aa435e3cb308880, processorArchitecture=MSIL" '''
            
    def __init__(self, file, attrib):
        self.file = file
        self.attrib = attrib
        include = attrib['Include'];
        w = include.split(',')
        self.name = w[0]
        self.attr = {}
        self.version = Doted("")
        for v in w[1:]:
            a = v.strip().split('=')
            if len(a)==2:
                key = a[0].strip()
                val = a[1].strip()
                self.attr[key] = val
                if key=="Version":
                    self.version = Doted(val)
            else:
                if len(a)==1:
                    self.attr[a[0].strip]=''
#        allRefs.append(self)
#        if self.name in refsByName:
#            refsByName[self.name].append(self)
#        else:
#            refsByName[self.name] = [self]        
                
    def toString(self):
        s = "Ref: <" + self.name +"> "
        for a in self.attr:
            s += a+" = "+ self.attr[a]+ "; "
        return s

    def match_attrib(self, other):
        return self.attrib == other.attrib

######################################

class Doted:
    ''' Doted version number with proper compare '''
    def __init__(self, s):
        self.string = s #original string
        self.arr =  list(map(lambda c: int(c) if c!='' else 0, s.split(".")))
        
    def compare(self, other):       
        for i in range(0, min(len(self.arr), len(other.arr))):
            if(self.arr[i]<other.arr[i]):
                return -1
            if(self.arr[i]>other.arr[i]):
                return 1
        #if everything is the same coose the longer over the shorter    
        if len(self.arr) < len(other.arr):
            return -1
        if len(self.arr) > len(other.arr):
            return 1
    
        return 0

    def __lt__(self, other):
        return self.compare(other)<0
    
    def __eq__(self, other):
        return self.compare(other)==0
           

######################################

def find_mismatches(n):
    ver = "Version"
    n = sorted(n, key=lambda r: r.version, reverse=True )
    #n = sorted(n, key=lambda r: r.attr[ver] if ver in r.attr else "", reverse=True )
    for r in n[1:] :
        if not n[0].match_attrib(r):
            print("attrib mismatch: \n")
            print(n[0].file + ": " + n[0].toString())
            print("\n");
            print(r.file + ": " + r.toString())
            print("\n\n");

######################################
    

for root, dirnames, filenames in os.walk(base_path):
    for filename in fnmatch.filter(filenames, '*.csproj'):
        matches.append(os.path.join(root, filename))

n=99999

#collect
for p in matches:
    print(p)
    refs_by_file[p] = []
    t = xml.etree.ElementTree.parse(p).getroot()
    for e in t.iter('*'):
        if e.tag.endswith("Reference"):
            r = Ref(p,e.attrib)
            references.append(r)
            refs_by_file[p].append(r)
            if( r.name in by_name ):
                by_name[r.name].append(r)
            else:    
                by_name[r.name] = [r]
                       
            #print(r.toString())
            # print(e.items())
    print('\n\n')
    n -= 1
    if(n<=0):
        break

#sort
for name in by_name:
    by_name[name].sort(key=lambda r: r.version, reverse=True )

#find outdated    
for name in by_name:
    n = by_name[name]
    find_mismatches(n)

for file in matches:
    print(file)
    if file not in refs_by_file : continue #because of n
    count = 0
    print("===============\n")
    for r in refs_by_file[file]:
        c = by_name[r.name][0]
        if r.version != c.version:
            count = count+1
            d = {'refname' : r.name, 'our_ver' : r.version.string,
            'last_ver' : c.version.string, 'last_file' : c.file,
            'full_info' : c.toString()
            }
            print("outdated {} : {} , {} at {} {}".format( \
                r.name, r.version.string, c.version.string, c.file, c.toString() ))

            #print("outdated %(refname)  " % d)
    if count>0:
        print( "%d refs out of date" % count )
    else:
        print( " file is up to date! ")
    print("\n\n")
    

print("\n\n")
                                
        

#fix..
            
        



       
