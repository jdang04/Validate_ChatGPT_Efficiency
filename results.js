
// Sample data for demonstration purposes 

const Sampledata = {
    Topic1: { Accuracy: 0.6, avgTime: 1000},
    Topic2: { Accuracy: 0.8, avgTime: 2000 },
    Topic3: {Accuracy: 0.7, avgTime: 3000},

}

// Extract data for charts 

const categories = Object.keys(Sampledata);

const Dataaccuracy = categories.map(s => Sampledata[s].Accuracy * 100); 

const ResponseTimeData = categories.map(s => Sampledata[s].avgTime);

// Accuracy Bar Chart 

const Accuracy = document.getElementById('AccuracyBarChart').getContext('2d');

const AccuracyBarChart = new Chart(Accuracy, {
   
    type: 'bar',
  
    data: {
    
    labels: categories,
     
    datasets: [{

       
        label: 'Accuracy Percentage Metrics',
       
        data: Dataaccuracy,
        
        backgroundColor: ['blue', 'red', 'green']
       
    }]
   },
   options: {
    
    
    scales: {
        y: {
            
            beginAtZero: true,
           
            
        }
     }
   }




});

// Response Time line Chart

const Response = document.getElementById('ResponseTimeLineChart').getContext('2d');

const ResponseTimeLineChart = new Chart(Response, {
    
    
    type: 'line',
    
    data: {
        
        labels: categories,
        
        datasets: [ {
           
            label: 'Response Time Average',
           
            data: ResponseTimeData,
           borderColor: 'black',
           
           tension: 0.1




        }]
    },
    options: {
        
       
       
        scales: {
            y: {
                    
            }
        }
    }
});

// Our combined Summary Dashboard Chart

const Combination = document.getElementById('CombinedSummaryDashboard').getContext('2d');

new Chart(Combination, {
    type: 'bar', 
    
    data: {
            
        labels: categories,
              
        datasets: [
            { 
                label: 'Percentage of Accuracy',
                data: Dataaccuracy,   
                
                backgroundColor: 'teal'
            },
            {
                label: 'Response Time Average',
                    
                data: ResponseTimeData, 
                backgroundColor: 'orange'
            },
            {
                label: 'Response Time (line)',
                    
                data: ResponseTimeData,
                
                type: 'line',
                  
                borderColor: 'black',
               
                tension: 0.1
            }
        ]
    },
    options: {
        
        scales: {
            y: {
                
            }
        }
    }

});