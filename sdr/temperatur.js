<!DOCTYPE html>
<html>
<head>
    <title>Temperature Monitoring</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@2.9.3/dist/Chart.min.js"></script>
</head>
<body>
    <canvas id="temperatureChart"></canvas>
    <script>
        var ctx = document.getElementById('temperatureChart').getContext('2d');
        var temperatureChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Temperature (°C)',
                    data: [],
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        setInterval(function() {
            fetch('/temperature')
                .then(response => response.json())
                .then(data => {
                    temperatureChart.data.labels.push(new Date().toLocaleTimeString());
                    temperatureChart.data.datasets[0].data.push(data.temperature);
                    temperatureChart.update();
                });
        }, 1000);
    </script>
</body>
</html>
