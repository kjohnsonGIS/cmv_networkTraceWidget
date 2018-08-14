# cmv_networkTraceWidget
Widget for CMV that utilizes [nicogis](https://github.com/nicogis)'s awesome SOE: https://github.com/nicogis/Geometric-Network-Utility-SOE 
To use the widget you can make a config like below in the viewer.js..  you also have to have a 1) geometric network in your gis 2) the above SOE installed in AGS and enabled on a map service that has your network layers in it.  
```
            valvetrace: {
                include: true,
                id: 'valvetrace',
                type: 'titlePane',
                canFloat: true,
                position: 24,
                path: 'gis/dijit/Widgets/ValveTrace',
                title: 'Valve Isolation Trace',
                iconClass: 'fa fa-chain-broken',             
                options: {
                    map: true,
                    mapClickMode: true,
                    url: 'https://yourserver/arcgis/rest/services/DistributionGeometricNetworkTrace/MapServer/exts/GeometricNetworkUtility/GeometricNetworks/1/', 
                    stationLayerId: 8, 
                    valveLayerId: 3, 
                    flowElements: 'esriFEJunctionsAndEdges', 
                    outFields:'FACILITYID,OBJECTID', 
                    maxTracedFeatures: 10000, 
                    tolerance: 12, 
                    flowMethod: 'esriFMConnected',
                    traceIndeterminateFlow: true,
                    traceSolverType:'FindFlowElements'
                }
            }
```           
