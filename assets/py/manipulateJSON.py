import json
import sys
from pprint import pprint

def write_file(file_details, dest_file):

	with open(dest_file, 'w') as output_file:
		json.dump(file_details, output_file)

def main():

    source_file = sys.argv[1]
    dest_file = sys.argv[2]

    with open(source_file) as data_file:    
        data = json.load(data_file)
    
    newData = list()
    for singleEntry in data['feed']['entry']:
        newEntry = dict()
        newEntry['date'] = singleEntry['gsx$date']['$t']
        newEntry['distancekm'] = singleEntry['gsx$distancekm']['$t']
        newEntry['time'] = singleEntry['gsx$time']['$t']
        newEntry['kcal'] = singleEntry['gsx$kcal']['$t']
        pprint(newEntry)
        
        newData.append(newEntry)

    write_file(newData, dest_file)

if __name__ == "__main__":
    main()
