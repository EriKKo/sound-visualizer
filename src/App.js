import React, {useState, useEffect} from 'react';
import './App.css';
import SoundCircle from "./SoundCircle";

function Range({label, description, value, min, max, step, onChange}) {
    return (
        <div style={{margin: "0.5rem 0", width: "100%"}}>
            <label>{label}</label>
            {description && <p className="range-description">{description}</p>}
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

const presets = {
    Smooth: {
        radius: 180, circleDecayRate: 0.3, audioDecayRate: 3, points: 150,
        pulseTime: 0.1, lineWidth: 4, maxDistortion: 0.3,
        minAudioLevel: 0, maxAudioLevel: 0.5, pointyDistortion: 0, fill: 0
    },
    Spiky: {
        radius: 180, circleDecayRate: 1.5, audioDecayRate: 5, points: 230,
        pulseTime: 0.05, lineWidth: 2, maxDistortion: 0.55,
        minAudioLevel: 0.02, maxAudioLevel: 0.4, pointyDistortion: 1, fill: 0
    },
    Blob: {
        radius: 180, circleDecayRate: 0.5, audioDecayRate: 2, points: 24,
        pulseTime: 0.18, lineWidth: 4, maxDistortion: 0.9,
        minAudioLevel: 0, maxAudioLevel: 0.5, pointyDistortion: 0, fill: 1
    }
};

function App() {
    let [radius, setRadius] = useState(presets.Smooth.radius);
    let [circleDecayRate, setCircleDecayRate] = useState(presets.Smooth.circleDecayRate);
    let [audioDecayRate, setAudioDecayRate] = useState(presets.Smooth.audioDecayRate);
    let [points, setPoints] = useState(presets.Smooth.points);
    let [pulseTime, setPulseTime] = useState(presets.Smooth.pulseTime);
    let [lineWidth, setLineWidth] = useState(presets.Smooth.lineWidth);
    let [maxDistortion, setMaxDistortion] = useState(presets.Smooth.maxDistortion);
    let [minAudioLevel, setMinAudioLevel] = useState(presets.Smooth.minAudioLevel);
    let [maxAudioLevel, setMaxAudioLevel] = useState(presets.Smooth.maxAudioLevel);
    let [pointyDistortion, setPointyDistortion] = useState(presets.Smooth.pointyDistortion);
    let [fill, setFill] = useState(presets.Smooth.fill);

    function applyPreset(name) {
        let p = presets[name];
        setRadius(p.radius);
        setCircleDecayRate(p.circleDecayRate);
        setAudioDecayRate(p.audioDecayRate);
        setPoints(p.points);
        setPulseTime(p.pulseTime);
        setLineWidth(p.lineWidth);
        setMaxDistortion(p.maxDistortion);
        setMinAudioLevel(p.minAudioLevel);
        setMaxAudioLevel(p.maxAudioLevel);
        setPointyDistortion(p.pointyDistortion);
        setFill(p.fill);
    }

    let canvasSize = Math.min(500, Math.min(document.documentElement.clientWidth, document.documentElement.clientHeight));

    useEffect(setupAudioTransmission, []);

    return (
        <div style={{minHeight: "100vh", display: "flex", justifyContent: "center", padding: "1rem"}}>
            <div style={{maxWidth: "1100px", display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "1.5rem"}}>
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

                <div className="controls" style={{width: "480px", padding: "1.75rem"}}>
                    <div className="presets">
                        {Object.keys(presets).map(function (name) {
                            return (
                                <button key={name}
                                        className="preset-button"
                                        onClick={function () { applyPreset(name); }}>
                                    {name}
                                </button>
                            );
                        })}
                    </div>
                    <div className="slider-grid">
                        <Range label="Radius"
                               description="Resting size, in pixels."
                               min={1}
                               max={200}
                               value={radius}
                               onChange={setRadius}/>
                        <Range label="Fill?"
                               description="Solid fill vs outline."
                               min={0}
                               max={1}
                               value={fill}
                               onChange={setFill}/>
                        <Range label="Line width"
                               description="Outline thickness."
                               min={1}
                               max={20}
                               value={lineWidth}
                               onChange={setLineWidth}/>
                        <Range label="Points"
                               description="Segment count — more = smoother."
                               min={2}
                               max={300}
                               value={points}
                               onChange={setPoints}/>
                        <Range label="Distortion"
                               description="How far points jump on a pulse."
                               min={0}
                               max={1}
                               step={0.01}
                               value={maxDistortion}
                               onChange={setMaxDistortion}/>
                        <Range label="Pointy distortion?"
                               description="Spikier deformation."
                               min={0}
                               max={1}
                               value={pointyDistortion}
                               onChange={setPointyDistortion}/>
                        <Range label="Pulse time"
                               description="Seconds per pulse."
                               min={0}
                               max={1}
                               step={0.01}
                               value={pulseTime}
                               onChange={setPulseTime}/>
                        <Range label="Circle decay"
                               description="How fast it relaxes back."
                               min={0}
                               max={5}
                               step={0.1}
                               value={circleDecayRate}
                               onChange={setCircleDecayRate}/>
                        <Range label="Audio decay"
                               description="How fast the peak fades."
                               min={0}
                               max={10}
                               step={0.1}
                               value={audioDecayRate}
                               onChange={setAudioDecayRate}/>
                        <Range label="Audio min"
                               description="Ignore quieter input."
                               min={0}
                               max={maxAudioLevel - 0.01}
                               step={0.01}
                               value={minAudioLevel}
                               onChange={setMinAudioLevel}/>
                        <Range label="Audio max"
                               description="Saturate at this level."
                               min={minAudioLevel + 0.01}
                               max={1}
                               step={0.01}
                               value={maxAudioLevel}
                               onChange={setMaxAudioLevel}/>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
