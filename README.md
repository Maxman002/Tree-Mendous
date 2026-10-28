# Tree-Mendous

This Repository is for the implementation of a project idea for the Green City Hackathon in Heilbronn for the team Tree-Mendous
Hackathon Website: https://hackathon.greencity.hn

## Create Python Virtual Environment

1. Create a Python virtual environment in the current folder:
   - `python3 -m venv .tree-mendous`
2. Activate Environment:
   - Windows: `.tree-mendous\Scripts\activate`
   - Mac/Unix: `source .wisis-llm-1/bin/activate`
3. Install necessary Python Lybraries:
   - `pip install -r requirements.txt`

## General Project Idea

Create a Website / Application which guides users through the city Heilbronn. The focus points would be spots in the city where the city has executed projects / initiatives in the past or plans to do so in the future. Those projects focus on making Heilbronn greener and more nature friendly for the european green city capital of 2027.
The purpose is to educate the user on these initiatives, what their purpose is, what problem they solve and what thei improve on. To show what each initiative improoves, data could be used to show what was / is problematic before (like the heat map or the streets where biking is unsafe)

Target Audience

- citisens of Heilbronn who want to inform themselves
- tourists who wants to sight see the european green city capital of 2027

### Features

#### Must

- Map with points of interest
  - Can click on them to get information about the initiatve
  - Problems it solves
  - Purpose
  - Who does it help
- sightseeing routes which connects certain points of interest
  - pre created area based routes (to visit all points of interest in a certain area)
  - pre created topic based routs (visit points of interest connected by a certain topic)
  - route can then be exported to google maps for navigation
- before after view
  - before: graphical data showing the problem which the initiative tries to adress and solve
  - after: if data available grphical view with the changes achieved by the initiative

#### Should

- Heat map and traffic map for navigation

#### Can

## TODOs

- access data and make it useful for us
  - heatmap of hotspots in the city
    - compare different areas depending on the heat
  - bike data: where is it unsafe to drive
  - (Air quality)
  - How does the current data impact the decisions of what the city wants to change through its initiatives
- see if the beehive data is useful?
- is the birds data useful?
- create a prototype of the actual project

- backend: stores statically processed data to create visualisation of on a map (heatmap, ...)
- frontend: website to interact with
- the view which is relevant shows up when clicking on a specific point of interest

## Route google maps link
https://www.google.com/maps/dir/?api=1&origin=49.139597,9.21981&destination=49.139597,9.21981&waypoints=49.142452,9.218943%7C49.142434,9.215012%7C49.147158,9.211756%7C49.150353,9.207446%7C49.151805,9.215302%7C49.151995,9.21548&travelmode=walking