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
xml_trees = {}

######################################

class Ref:
    ''' a library reference '''
    ''' Include="FluentNHibernate, Version=1.0.0.0, Culture=neutral, PublicKeyToken=8aa435e3cb308880, processorArchitecture=MSIL" '''
            
    def __init__(self, file, element):
        self.file = file
        self.element = element
        attrib = element.attrib
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
    
def fix_references(file):
    ''' fix outdated attributes and save file '''
    t = xml_trees[file]
    for r in refs_by_file[file]:
        c = by_name[r.name][0]
        if r.version != c.version:
#            replace_element(t, r.element, c.element)
            r.element.clear()
            r.element.attrib = c.element.attrib
            copy_children(c.element, t, r.element)
    t.write(file+".new",method="xml") #,default_namespace="http://schemas.microsoft.com/developer/msbuild/2003")        

def copy_children(src, et, dest):
    for e in src:
        dest.append(e)
#        dd = xml.etree.ElementTree.SubElement(dest, e.tag, e.attrib)
#        if len(list(e))>0 :
#            copy_children(e, et, dd)

def find_parent(root, element):
    if root==element:
        return element
    for e in root:
        p = find_parent(e, element)
        if p is not None  :
            return p
    return None 

def replace_element(tree, old, new):
    parent = find_parent(tree.getroot(), old)
    e = xml.etree.ElementTree.fromstring( xml.etree.ElementTree.tostring(new) )
    parent.insert(0,e)


##############################
    
for root, dirnames, filenames in os.walk(base_path):
    for filename in fnmatch.filter(filenames, '*.csproj'):
        matches.append(os.path.join(root, filename))

n=99999

#collect
for p in matches:
    print(p)
    refs_by_file[p] = []
    xml.etree.ElementTree.register_namespace('',"http://schemas.microsoft.com/developer/msbuild/2003")
    t = xml.etree.ElementTree.parse(p)
    root = t.getroot()
    xml_trees[p] = t
    for e in root.iter('*'):
        if e.tag.endswith("Reference"):
            r = Ref(p,e)
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

#for name in by_name:
#    n = by_name[name]
#    find_mismatches(n)

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
        fix_references(file)
    else:
        print( " file is up to date! ")
    print("\n\n")
    

print("\n\n")
                                
        

#fix..
            
        



       
