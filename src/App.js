import React, {useState, useEffect} from 'react';
import './App.css';
import SoundCircle from "./SoundCircle";

function Range({label, value, min, max, step, onChange}) {
    return (
        <div style={{margin: "0.5rem 0", width: "100%"}}>
            <label>{label}</label>
            <input type="range"
                   min={min}
                   max={max}
                   step={step}
                   value={value}
                   onChange={function ({target: {value}}) {
                       onChange(parseFloat(value));
                   }}/>
            <span style={{marginLeft: "5px"}}>{value}</span>
        </div>
    );
}

const eventEmitter = (function Event() {
    let listener = null;
    return {
        onEvent: function (l) {
            listener = l;
        },
        triggerEvent: function (value) {
            listener && listener(value);
        }
    }
})();

function setupAudioTransmission() {
    let context, source, processor, intervalId;

    function handleSuccess(stream) {
        context = new AudioContext();
        source = context.createMediaStreamSource(stream);
        processor = context.createScriptProcessor(1024, 1, 1);

        source.connect(processor);
        processor.connect(context.destination);

        processor.onaudioprocess = function(e) {
            let data = e.inputBuffer.getChannelData(0);
            let average = data.reduce(function (sum, f) {
                return sum + Math.abs(f);
            }, 0) / data.length;
            eventEmitter.triggerEvent(average);
        };
    }

    function handleRejection() {
        // Set up a randomized stream instead of real audio
        intervalId = setInterval(function () {
            eventEmitter.triggerEvent(Math.random() * Math.random() * Math.random() * 0.5);
        }, 16);
    }

    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(handleSuccess)
        .catch(handleRejection);

    return function cleanup() {
        if (processor) {
            source && source.disconnect(processor);
            processor.disconnect(context.destination);
        }
        clearInterval(intervalId);
    }
}

function App() {
    let [radius, setRadius] = useState(150);
    let [circleDecayRate, setCircleDecayRate] = useState(0.3);
    let [audioDecayRate, setAudioDecayRate] = useState(3);
    let [points, setPoints] = useState(150);
    let [pulseTime, setPulseTime] = useState(0.1);
    let [lineWidth, setLineWidth] = useState(4);
    let [maxDistortion, setMaxDistortion] = useState(0.3);
    let [minAudioLevel, setMinAudioLevel] = useState(0);
    let [maxAudioLevel, setMaxAudioLevel] = useState(0.5);
    let [pointyDistortion, setPointyDistortion] = useState(0);
    let [fill, setFill] = useState(0);

    let canvasSize = Math.min(500, Math.min(document.documentElement.clientWidth, document.documentElement.clientHeight));

    useEffect(setupAudioTransmission, []);

    return (
        <div style={{height: "100vh", display: "flex", justifyContent: "center"}}>
            <div style={{maxWidth: "800px", display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center"}}>
                <SoundCircle width={canvasSize}
                             height={canvasSize}
                             color={"#1DB954"}
                             lineWidth={lineWidth}
                             fill={fill}
                             points={points}
                             maxDistortion={maxDistortion}
                             pointyDistortion={pointyDistortion}
                             pulseTime={pulseTime}
                             audioDecayRate={audioDecayRate}
                             circleDecayRate={circleDecayRate}
                             audioEventEmitter={eventEmitter}
                             minAudioLevel={minAudioLevel}
                             maxAudioLevel={maxAudioLevel}
                             radius={radius}/>

                <div style={{width: "200px", padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center"}}>
                    <Range label="Radius"
                           min={1}
                           max={200}
                           value={radius}
                           onChange={setRadius}/>
                    <Range label="Fill?"
                           min={0}
                           max={1}
                           value={fill}
                           onChange={setFill}/>
                    <Range label="Line width"
                           min={1}
                           max={20}
                           value={lineWidth}
                           onChange={setLineWidth}/>
                    <Range label="Points"
                           min={2}
                           max={300}
                           value={points}
                           onChange={setPoints}/>
                    <Range label="Distortion"
                           min={0}
                           max={1}
                           step={0.01}
                           value={maxDistortion}
                           onChange={setMaxDistortion}/>
                    <Range label="Pointy distortion?"
                           min={0}
                           max={1}
                           value={pointyDistortion}
                           onChange={setPointyDistortion}/>
                    <Range label="Pulse time"
                           min={0}
                           max={1}
                           step={0.01}
                           value={pulseTime}
                           onChange={setPulseTime}/>
                    <Range label="Circle decay rate"
                           min={0}
                           max={5}
                           step={0.1}
                           value={circleDecayRate}
                           onChange={setCircleDecayRate}/>
                    <Range label="Audio decay rate"
                           min={0}
                           max={10}
                           step={0.1}
                           value={audioDecayRate}
                           onChange={setAudioDecayRate}/>
                    <Range label="Audio min pickup"
                           min={0}
                           max={maxAudioLevel - 0.01}
                           step={0.01}
                           value={minAudioLevel}
                           onChange={setMinAudioLevel}/>
                    <Range label="Audio max pickup"
                           min={minAudioLevel + 0.01}
                           max={1}
                           step={0.01}
                           value={maxAudioLevel}
                           onChange={setMaxAudioLevel}/>
                </div>
            </div>
        </div>
    );
}

export default App;
