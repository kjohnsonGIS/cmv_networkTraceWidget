define([
	'dojo/_base/declare',
	'dijit/_WidgetBase',
	'dijit/_TemplatedMixin',
    'dijit/_WidgetsInTemplateMixin',
    'dojox/grid/DataGrid',
    'dojo/data/ItemFileWriteStore',
	'dojo/_base/lang',
    'dojo/topic',
    'dojo/aspect',
    "dojo/dom",
    'dojo/json',
    'dojo/on',
    'esri/layers/GraphicsLayer',
    'esri/toolbars/draw',
    'esri/graphic',
    'esri/renderers/SimpleRenderer',
    'esri/symbols/PictureMarkerSymbol',
    'esri/graphicsUtils',
    'esri/geometry/Point',
    'esri/SpatialReference',
	'esri/geometry/Extent',
    'esri/tasks/FeatureSet',    
    'esri/tasks/Geoprocessor',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/symbols/SimpleLineSymbol',
    "esri/Color",
    'esri/request',
	'proj4js/proj4',
    'dojo/text!./ValveTrace/templates/ValveTrace.html',
    
    'dijit/form/Button',
    "dijit/form/Select",
	'xstyle/css!./ValveTrace/css/ValveTrace.css'
], function (
	declare,
	_WidgetBase,
	_TemplatedMixin,
    _WidgetsInTemplateMixin,  
    DataGrid, ItemFileWriteStore,
	lang, topic, aspect,dom, JSON, on,
    GraphicsLayer, Draw, Graphic, SimpleRenderer, PictureMarkerSymbol, graphicsUtils, Point, SpatialReference, Extent,FeatureSet, Geoprocessor, SimpleMarkerSymbol,SimpleLineSymbol,Color,
    esriRequest,
	proj4,
    template
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
        map: null,
        widgetsInTemplate: true,
        templateString: template,
        baseClass: 'gis_ValveTraceDijit',
        topicID: 'attributesContainer',
        drawToolbar: null,
        mapClickMode: null,
        url: '',  
        stationLayerId: 8, 
        valveLayerId: 3, 
        flowElements: 'esriFEJunctionsAndEdges', 
        outFields:'FACILITYID,OBJECTID', 
        maxTracedFeatures: 10000, 
        tolerance: 12, 
        flowMethod: 'esriFMConnected',
        traceIndeterminateFlow: true,  
        traceSolverType:'FindFlowElements',

        postCreate: function () {
            this.inherited(arguments);
            this.drawToolbar = new Draw(this.map);
            this.drawToolbar.on('draw-end', lang.hitch(this, 'onDrawToolbarDrawEnd'));
            
            this.createGraphicLayers();
            this.traceSelectChecker();
            this.own(topic.subscribe('mapClickMode/currentSet', lang.hitch(this, 'setMapClickMode')));
            if (this.parentWidget && this.parentWidget.toggleable) {
                this.own(aspect.after(this.parentWidget, 'toggle', lang.hitch(this, function () {
                    this.onLayoutChange(this.parentWidget.open);
                })));
            }         
            //below is testing to help testing the removeTable topic
            this.own(topic.subscribe('trvalveisolationResults/tableRemoved', function(){
                alert('removeTable is working!');
            }));

        },
        createGraphicLayers: function () {
            //flag symbol and graphic
            var flagline = new SimpleLineSymbol();
            flagline.setColor(new Color([38, 115, 0, 1]));
            this.flagSymbol =  new SimpleMarkerSymbol();  
            this.flagSymbol.setAngle(0);
            this.flagSymbol.setColor(new Color([76, 230, 0, 0.78]));
            this.flagSymbol.setOutline(flagline);
            this.flagSymbol.setStyle(SimpleMarkerSymbol.STYLE_SQUARE);
            this.flagGraphics = new GraphicsLayer({
                id: 'flaggraphic',
                title: 'Flag Graphic'
            });
            this.flagRenderer = new SimpleRenderer(this.flagSymbol);
            this.flagRenderer.label = 'flag';
            this.flagRenderer.description = 'flag';
            this.flagGraphics.setRenderer(this.flagRenderer);
            this.map.addLayer(this.flagGraphics); 
            
            //junction barrier symbol and graphic
            var jbarrierline = new SimpleLineSymbol();
            jbarrierline.setColor(new Color([98, 15, 0, 1]));
            this.jbarrierSymbol =  new SimpleMarkerSymbol();  
            this.jbarrierSymbol.setAngle(0);
            this.jbarrierSymbol.setColor(new Color([96, 130, 10, 0.78]));
            this.jbarrierSymbol.setOutline(jbarrierline);
            this.jbarrierSymbol.setStyle(SimpleMarkerSymbol.STYLE_X);
            this.jbarrierGraphics = new GraphicsLayer({
                id: 'jbarriergraphic',
                title: 'junction barrier Graphic'
            });
            this.jbarrierRenderer = new SimpleRenderer(this.jbarrierSymbol);
            this.jbarrierRenderer.label = 'junction barrier';
            this.jbarrierRenderer.description = 'junction barrier';
            this.jbarrierGraphics.setRenderer(this.jbarrierRenderer);
            this.map.addLayer(this.jbarrierGraphics);   
            
            //edge barrier symbol and graphic
            var ebarrierline = new SimpleLineSymbol();
            ebarrierline.setColor(new Color([22, 15, 0, 1]));
            this.ebarrierSymbol =  new SimpleMarkerSymbol();  
            this.ebarrierSymbol.setAngle(0);
            this.ebarrierSymbol.setColor(new Color([96, 130, 10, 0.78]));
            this.ebarrierSymbol.setOutline(ebarrierline);
            this.ebarrierSymbol.setStyle(SimpleMarkerSymbol.STYLE_X);
            this.ebarrierGraphics = new GraphicsLayer({
                id: 'ebarriergraphic',
                title: 'edge barrier Graphic'
            });
            this.ebarrierRenderer = new SimpleRenderer(this.ebarrierSymbol);
            this.ebarrierRenderer.label = 'edge barrier';
            this.ebarrierRenderer.description = 'edge barrier';
            this.ebarrierGraphics.setRenderer(this.ebarrierRenderer);
            this.map.addLayer(this.ebarrierGraphics);               
    
            //output junctions symbol and graphic
            var ojline = new SimpleLineSymbol();
            ojline.setColor(new Color([230,0,0,0.25]));   
            this.ojSymbol =  new SimpleMarkerSymbol();  
            this.ojSymbol.setSize(10);
            this.ojSymbol.setColor(new Color([230,0,0,0.25]));
            this.ojSymbol.setOutline(ojline);
            this.ojSymbol.setStyle(SimpleMarkerSymbol.STYLE_CIRCLE);
            this.ojGraphics = new GraphicsLayer({
                id: 'ojgraphic',
                title: 'out junction Graphic'
            });
            this.ojRenderer = new SimpleRenderer(this.ojSymbol);
            this.ojRenderer.label = 'oj';
            this.ojRenderer.description = 'oj';
            this.ojGraphics.setRenderer(this.ojRenderer);
            this.map.addLayer(this.ojGraphics);   
            
               
            //output line symbol and graphic
            this.olline = new SimpleLineSymbol();
            this.olline.setWidth(7);
            this.olline.setColor(new Color([230,0,0,0.25]));   
            this.olGraphics = new GraphicsLayer({
                id: 'olgraphic',
                title: 'out line Graphic'
            });
            this.olRenderer = new SimpleRenderer(this.olline);
            this.olRenderer.label = 'ol';
            this.olRenderer.description = 'ol';
            this.olGraphics.setRenderer(this.olRenderer);
            this.map.addLayer(this.olGraphics);                 
        },

        setMapClickMode: function (mode) {
            this.mapClickMode = mode;
        },
        traceSelectChecker: function () {
            //initial check of select drop down, to determine if barrier buttons should be disabled.
            var selectTraceMode = this.traceSelectDijit.get("value");
            if (selectTraceMode === 'Isolation') {
                this.addEdgeBarrierDijit.set('disabled', true);
                this.addJunctionBarrierDijit.set('disabled', true);
            }
            //wwhen the select dropdown changes enable or disable the barrier buttons
            this.traceSelectDijit.on('change', lang.hitch(this, function(evt){
                if (evt === 'Connected') {
                    this.addEdgeBarrierDijit.set('disabled', false);
                    this.addJunctionBarrierDijit.set('disabled', false);
                } else if (evt === 'Isolation'){
                    this.addEdgeBarrierDijit.set('disabled', true);
                    this.addJunctionBarrierDijit.set('disabled', true);                    
                }                 
            }));
        },
        onDrawToolbarDrawEnd: function (evt) {          
            this.drawToolbar.deactivate();
            this.drawModeTextNode.innerText = 'Not Selected';
            var graphic;
            switch (evt.geometry.type) {
            case 'point':
                graphic = new Graphic(evt.geometry);
                switch (this.drawType) {
                    case 'flag':
                        this.flagGraphics.add(graphic);
                        break;
                    case 'junctionbarrier':
                        this.jbarrierGraphics.add(graphic);
                        break;
                    case 'edgebarrier':
                        this.ebarrierGraphics.add(graphic);
                        break;
                }
                break;
            default:
            }
            this.connectMapClick();
        },
        disableEnableBarriers: function (mode){
            if (mode=== 'Connected') {
                this.addEdgeBarrierDijit.set('disabled', true);
                this.addJunctionBarrierDijit.set('disabled', true);
            }               
        },
        connectMapClick: function () {
            topic.publish('mapClickMode/setDefault');
            this.disableStopButtons();
        },   
        disconnectMapClick: function () {
            topic.publish('mapClickMode/setCurrent', 'trace');
            this.enableStopButtons();
        },        
        onLayoutChange: function (open) {
            // end drawing on close of title pane
            if (!open) {
                if (this.mapClickMode === 'trace') {
                    topic.publish('mapClickMode/setDefault');
                }
            }
        },  
        stopDrawing: function () {
            this.drawToolbar.deactivate();
            this.drawModeTextNode.innerText = 'None';
            this.connectMapClick();
        },        
        disableStopButtons: function () {
            this.stopDrawingButton.set('disabled', true);
            this.eraseDrawingButton.set('disabled', !this.noGraphics());
        },
        enableStopButtons: function () {
            this.stopDrawingButton.set('disabled', false);
            this.eraseDrawingButton.set('disabled', !this.noGraphics());
        },   
        noGraphics: function () {
            if (this.flagGraphics.graphics.length > 0 || this.jbarrierGraphics.graphics.length > 0 || this.ebarrierGraphics.graphics.length > 0) {
                return true;
            } else {
                return false;
            }
        },        
        drawFlag: function () {
            this.disconnectMapClick();
            this.drawToolbar.activate(Draw.POINT);
            this.drawModeTextNode.innerText = 'Add Flag';
            this.drawType = 'flag'
        },   
        drawBarrier: function () {
            this.disconnectMapClick();
            this.drawToolbar.activate(Draw.POINT);
            this.drawModeTextNode.innerText = 'Add Junction Barrier';
            this.drawType = 'junctionbarrier';
        }, 
        drawEdgeBarrier: function () {
            this.disconnectMapClick();
            this.drawToolbar.activate(Draw.POINT);
            this.drawModeTextNode.innerText = 'Add Edge Barrier';
            this.drawType = 'edgebarrier';
        },         
        addingFlagPoints: function () {
            this.map.setMapCursor('crosshair');  
            topic.publish('mapClickMode/setCurrent', 'trace');
        },
        cancelTrace: function () {
            this.map.setMapCursor('auto');
            topic.publish('mapClickMode/setDefault');
        },
        clearResults: function () {
            this.endDrawing();
            this.connectMapClick();
            this.drawModeTextNode.innerText = 'None';
            for (var i=0; i < 18; i++){
                topic.publish('tr' + i.toString() + 'isolationResults' + '/clearAll');   
                //below is not working
                topic.publish('tr' + i.toString() + 'isolationResults' + '/removeTable');                    
            }
            topic.publish('trvalvesisolationResults' + '/clearAll');
            //below is not working
            topic.publish('trvalvesisolationResults' + '/removeTable');            

        },
        endDrawing: function () {
            this.flagGraphics.clear();
            this.jbarrierGraphics.clear();
            this.ebarrierGraphics.clear();
            this.ojGraphics.clear();
            this.olGraphics.clear();
            this.drawToolbar.deactivate();
            this.disableStopButtons();
        },        
        solveTrace: function () {
            var traceMode = null;
            if (this.flagGraphics.graphics.length === 1) {
                traceMode = this.traceSelectDijit.get("value");
                if (traceMode === 'Isolation') {
                    this.getxhrTextContent(this.flagGraphics.graphics, 'IsolateValve');
                } else if (traceMode ==='Connected') {
                    this.getxhrTextContent(this.flagGraphics.graphics, 'TraceNetwork')
                }  
                this.displayTraceMessage('show', 'getting results, please wait');
                this.disableButtonsOnProcess();
                if  (this.ojGraphics.graphics.length > -1 ) {
                    this.ojGraphics.clear();
                }
                if (this.olGraphics.graphics.length > -1) {
                    this.olGraphics.clear();
                }
                
            } else {
                console.log( 'need only one flag');
                topic.publish('growler/growl', {
                    title: 'Network Trace',
                    message: 'Tool only supports placing one flag.  The map contains: ' + this.flagGraphics.graphics.length + ' flags.'
                });                
                return;
            }
        },
        getxhrTextContent: function (options, traceType) {
            var flagGeometry = [];
            flagGeometry.push(options[0].geometry);
            var edgeBarrierGeometry = [];
            var edgeBarriers = '';
            var junctionBarrierGeom = [];
            var junctionBarriers = '';

            if (this.ebarrierGraphics.graphics.length > -1) {
                for (var e =0; e< this.ebarrierGraphics.graphics.length; e++) {
                    edgeBarrierGeometry.push(this.ebarrierGraphics.graphics[e].geometry);
                }
                edgeBarriers = JSON.stringify(edgeBarrierGeometry);
            }
            if (this.jbarrierGraphics.graphics.length > -1) {
                for (var j =0; j< this.jbarrierGraphics.graphics.length; j++) {
                    junctionBarrierGeom.push(this.jbarrierGraphics.graphics[j].geometry);
                }
                junctionBarriers = JSON.stringify(junctionBarrierGeom);
            }            
            var edgeFlags = JSON.stringify(flagGeometry);

            var isolationParams = {
                    f: "pjson",
                    stationLayerId:this.stationLayerId,
                    valveLayerId:this.valveLayerId,
                    flowElements:this.flowElements,
                    edgeFlags: edgeFlags,
                    junctionFlags:'',
                    edgeBarriers: '',
                    junctionBarriers:'',
                    outFields:this.outFields,
                    maxTracedFeatures:this.maxTracedFeatures,
                    tolerance:this.tolerance
                };   

            var connectivityParams = {
                    f: "pjson",
                    traceSolverType:this.traceSolverType,
                    flowMethod: this.flowMethod, 
                    traceIndeterminateFlow: this.traceIndeterminateFlow,
                    flowElements: this.flowElements,
                    edgeFlags: edgeFlags,
                    junctionFlags:'',
                    edgeBarriers: edgeBarriers,
                    junctionBarriers:junctionBarriers,
                    outFields:this.outFields,
                    maxTracedFeatures:this.maxTracedFeatures,
                    tolerance:this.tolerance
                };   
            var contentParams = traceType === 'IsolateValve' ? isolationParams : connectivityParams;
            var def = esriRequest({
                url: this.url + traceType,
                content: contentParams,
                callbackParamName: "callback",
                handleAs: "json"
            });
            def.then( lang.hitch(this,
                function (response) {
                    if (response.hasError){
                        topic.publish('growler/growl', {
                            title: 'Network Trace',
                            message: 'Error: ' +  response.errorDescription
                        });   
                        this.displayTraceMessage('hide','');
                        this.enableButtonsOnResults();
                    } else {
                        this.processResults(response);                        
                    }
                }),
                function (error) {
                    console.log("Error: ", error);
                });
        }, 
        processResults: function (results) { 
            var counter= 0;
            var geomTyoe = null;
            if (results.edges) {
                this.displayTraceMessage('hide','');
                for (var resgroup in results){
                    if (resgroup === 'valves' || resgroup === 'junctions' ||  resgroup ==='edges' ){
                        //the valves group that gets returned is not an array.  
                        if (results[resgroup].length === undefined && resgroup === 'valves' ){
                            this.openTable(results[resgroup], 'valves', resgroup);                             
                        } else if (results[resgroup].length === undefined && resgroup != 'valves' ) {
                            counter +=1;
                            this.openTable(results[resgroup], counter, resgroup); 
                        } else if (results[resgroup].length > -1) {
                             for (i=0; i < results[resgroup].length; i++){
                                counter +=1;
                                this.openTable(results[resgroup][i], counter, resgroup);                                  
                             }
                        }
                    }
                }
                topic.publish('viewer/togglePane', {
                    pane: 'bottom', 
                    show: 'block'
                }); 
                this.enableButtonsOnResults();
            }
        },
        openTable: function (values, cnter, resgroup) {
            var OGgraphic = null;
            var OLgraphic = null;
            var graphicObj = {};
            var nextGraphicSet = null;
            // create the feature set to pass to the attribute table
            var featureSet = new FeatureSet(values);
            //add graphics to map for junction features
            if (resgroup === 'junctions' && values.features.length > -1) {
                nextGraphicSet = values.features;
                for (x=0; x< nextGraphicSet.length; x++){
                    graphicObj["geometry"] = nextGraphicSet[x].geometry;       
                    OGgraphic = new Graphic(graphicObj);  
                    this.ojGraphics.add(OGgraphic);                     
                }
            //add graphics to map for edge features
            } else if (resgroup === 'edges' && values.features.length > -1) {
                nextGraphicSet = values.features;
                for (y=0; y< nextGraphicSet.length; y++){
                    graphicObj["geometry"] =  nextGraphicSet[y].geometry;       
                    OLgraphic = new Graphic(graphicObj);
                    this.olGraphics.add(OLgraphic);
                }
            }
            //remove existing table before adding new one
            //which is not working at the moment
            topic.publish('tr' + cnter.toString() + 'isolationResults' + '/removeTable');  
            // add the new table- this works fine
            topic.publish('attributesContainer/addTable', {
                title: 'tr' + cnter.toString(),
                topicID: 'tr' + cnter.toString() + 'isolationResults',  
                closable: true,
                confirmClose: true,
                useTabs:true,
                symbolOptions: {
                    features: {
                         point: {
                            type: 'esriSMS',
                            style: 'esriSMSCircle',
                            size: 10,
                            color: [ 168,0,0,64],
                            angle: 0,
                            xoffset: 0,
                            yoffset: 0,
                            outline: {
                                type: 'esriSLS',
                                style: 'esriSLSSolid',
                                color: [230,0,0,255],
                                width: 1
                            }
                        },
                        polyline: {
                            type: 'esriSLS',
                            style: 'esriSLSSolid',
                            color: [230,0,0,255],
                            width: 1
                        }       
                    }
                },
                featureOptions: {
                    zoomToSource: false
                }                    
            });           
            //populate the newly created table with the featureset- topic is the same as the topicID using in "addTable", this works fine
            topic.publish('tr' + cnter.toString() + 'isolationResults' + '/populateGrid', featureSet);    
                

                         
        },
        displayTraceMessage: function (mode, message) {
            if (mode === 'show') {
                this.traceResultsNode.style.display = 'block';                
            } else if (mode === 'hide') {
                this.traceResultsNode.style.display = 'none'; 
            }

        }, 
        disableButtonsOnProcess: function () {
            this.traceExecuteButton.set('disabled', true);
        },
        enableButtonsOnResults: function () {
            this.traceExecuteButton.set('disabled', false);
        }        

    });
});
