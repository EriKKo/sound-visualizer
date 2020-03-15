import React, {useRef, useEffect} from "react";

function createArray(l, v) {
    let a = [];
    for (let i = 0; i < l; i++) {
        a.push(v);
    }
    return a;
}

export default function SoundCircle(props) {
    let canvasRef = useRef(null);
    let {
        radius,
        color = "blue",
        lineWidth = 4,
        points = 100,
        maxDistortion = 0.2,
        audioDecayRate = 2,
        circleDecayRate = 2,
        pulseTime = 0.2,
        pointyDistortion,
        fill,
        audioEventEmitter,
        minAudioLevel,
        maxAudioLevel,
        ...otherProps
    } = props;

    useEffect(function () {
        let animationFrameId;
        let radii = createArray(points, radius);
        let pulseRadii = createArray(points, radius);
        let lastPulseTime = Date.now();
        let lastAnimationTime = Date.now();
        let pulseDone = false;
        let audioValue = 0;

        audioEventEmitter.onEvent(function (value) {
            if (value > audioValue) {
                audioValue = value;
                let clippedAudioValue = Math.min(Math.max(minAudioLevel, audioValue), maxAudioLevel);
                let distortion = maxDistortion * (clippedAudioValue - minAudioLevel) / (maxAudioLevel - minAudioLevel);
                if (distortion > 1000) {
                    console.log(distortion);
                    console.log(maxDistortion, clippedAudioValue, audioValue, minAudioLevel, maxAudioLevel);
                }
                for (let p = 0; p < points; p++) {
                    pulseRadii[p] = radius * (1 + distortion * (2 * Math.random() - 1));
                    if (pulseRadii[p] > 1000) {
                        console.log(maxDistortion, clippedAudioValue, audioValue, minAudioLevel, maxAudioLevel);
                    }
                }
                pulseDone = false;
                lastPulseTime = Date.now();
            }
        });

        function updatePoints() {
            let time = Date.now();
            let deltaTime = (time - lastAnimationTime) / 1000;
            let timeSincePulse = (time - lastPulseTime) / 1000;

            // Decay audio value
            audioValue = Math.max(0, audioValue * (1 - deltaTime * audioDecayRate));

            if (timeSincePulse < pulseTime) {
                // Pulse phase
                let animationLeft = pulseTime - timeSincePulse + deltaTime;
                let amount = deltaTime / animationLeft;
                for (let p = 0; p < points; p++) {
                    let distanceLeft = pulseRadii[p] - radii[p];
                    radii[p] += distanceLeft * amount;
                    if (Math.abs(radii[p]) > 1000) {
                        console.log(pulseRadii[p]);
                        console.log(radii[p]);
                        console.log(distanceLeft, amount);
                    }
                }
            } else {
                if (!pulseDone) {
                    // Let's finish the last of the pulse
                    for (let p = 0; p < points; p++) {
                        radii[p] = pulseRadii[p];
                    }
                    pulseDone = true;
                    deltaTime -= timeSincePulse - pulseTime;
                }
                // Decay phase
                let dist = radius * deltaTime * circleDecayRate;
                for (let p = 0; p < points; p++) {
                    if (radii[p] < radius) {
                        radii[p] = Math.min(radius, radii[p] + dist);
                    } else {
                        radii[p] = Math.max(radius, radii[p] - dist);
                    }
                }
            }
            lastAnimationTime = time;
        }

        function animate() {
            updatePoints();
            let canvas = canvasRef.current;
            let context = canvas.getContext("2d");
            let w = canvas.width;
            let h = canvas.height;
            context.strokeStyle = color;
            context.fillStyle = color;
            context.lineWidth = lineWidth;
            context.clearRect(0, 0, w, h);
            context.beginPath();
            context.moveTo(w / 2 + radii[radii.length - 1], h / 2);

            let d = radius * 4 / 3 * Math.tan(Math.PI / 2 / points);
            let ad = Math.atan(d / radius);
            for (let p = 0; p < points; p++) {
                let targetAngle = 2 * Math.PI * (p + 1) / points; // Angle from circle center to target point
                let sourceAngle = 2 * Math.PI * p / points; // Angle from circle center to source point
                let sourceX = radii[p] * Math.cos(targetAngle) + w/2;
                let sourceY = radii[p] * Math.sin(targetAngle) + h/2;
                let cp1Radius = Math.sqrt(d * d + radii[(p + points - 1) % points] * radii[(p + points - 1) % points]); // Control point 1 radius
                let cp2Radius = Math.sqrt(d * d + radii[p] * radii[p]); // Control point 2 radius
                let cpx1 = cp1Radius * Math.cos(sourceAngle + ad) + w/2;
                let cpy1 = cp1Radius * Math.sin(sourceAngle + ad) + h/2;
                let cpx2 = cp2Radius * Math.cos(targetAngle - ad) + w/2;
                let cpy2 = cp2Radius * Math.sin(targetAngle - ad) + h/2;

                if (pointyDistortion) {
                    // Swapping the control points gives a little pointier behavior
                    context.bezierCurveTo(cpx2, cpy2, cpx1, cpy1, sourceX, sourceY);
                } else {
                    context.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, sourceX, sourceY);
                }

            }
            fill ? context.fill() : context.stroke();
            animationFrameId = requestAnimationFrame(animate);
        }
        animationFrameId = requestAnimationFrame(animate);

        return function () {
            cancelAnimationFrame(animationFrameId);
        }
    });

    return (
        <canvas {...otherProps} ref={canvasRef}/>
    );
}