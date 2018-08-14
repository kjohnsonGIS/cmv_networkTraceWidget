# cmv_networkTraceWidget
Widget for CMV that utilizes this great SOE: https://github.com/nicogis/Geometric-Network-Utility-SOE

uses a config like this in the viewer.js
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
