# Scan all csproj files and chec the references

import fnmatch
import os
import xml
import xml.etree.ElementTree

base_path = ".."

allRefs = []
refsByName = {}  # dictionaty of lists
matches = []

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
        for v in w[1:]:
            a = v.strip().split('=')
            if len(a)==2:
                self.attr[a[0].strip()]=a[1].strip()
            else:
                if len(a)==1:
                    self.attr[a[0].strip]=''
        allRefs.append(self)
        if self.name in refsByName:
            refsByName[self.name].append(self)
        else:
            refsByName[self.name] = [self]        
                
    def toString(self):
        s = "Ref: <" + self.name +"> "
        for a in self.attr:
            s += a+" = "+ self.attr[a]+ "; "
        return s

######################################


for root, dirnames, filenames in os.walk(base_path):
    for filename in fnmatch.filter(filenames, '*.csproj'):
        matches.append(os.path.join(root, filename))

n=3
for p in matches:
    print(p)
    t = xml.etree.ElementTree.parse(p).getroot()
    for e in t.iter('*'):
        if e.tag.endswith("Reference"):
            r = Ref(p,e.attrib)
            print(r.toString())
            # print(e.items())
    print('\n\n')
    n -= 1
    if(n<=0):
        break

#find includes with mismatched versions
#fix..
            
        



       
