class ChartManager {
  static tbpChart = null;
  static drawTBP(curve){/*
    const canvas=document.getElementById("tbpChart");
    if(!canvas || typeof Chart==="undefined") return;
    if(this.tbpChart) this.tbpChart.destroy();
    this.tbpChart = new Chart(canvas.getContext("2d"), {
      type:"line",
      data:{labels:curve.map(p=>p.volume),datasets:[{label:"TBP Temperature, °F",data:curve.map(p=>p.temperature),borderWidth:2,tension:0.15}]},
      options:{responsive:true,scales:{x:{title:{display:true,text:"Volume % Distilled"}},y:{title:{display:true,text:"Temperature, °F"}}}}
    });*/
	this.drawTBPComparison({label:"TBP Curve",  curve:curve},[]);}
  
  /**/
					  static drawTBPComparison(
						mainCurve,
						comparisonCurves = []
					){

						const canvas =
						document
						.getElementById(
							"tbpChart"
						);

						if(
							!canvas ||
							typeof Chart === "undefined"
						){
							return;
						}

						if(this.tbpChart){

							this.tbpChart.destroy();

						}

						const datasets = [

							{
								label:
								mainCurve.label,

								data:
								mainCurve.curve.map(
									p => p.temperature
								),

								borderWidth:
								3,

								tension:
								0.15

							}

						];

						comparisonCurves.forEach(
							item => {

								datasets.push({

									label:
									item.label,

									data:
									item.curve.map(
										p => p.temperature
									),

									borderWidth:
									2,

									borderDash:
									[6,4],

									tension:
									0.15

								});

							}
						);

						this.tbpChart =
						new Chart(
							canvas.getContext(
								"2d"
							),
							{
								type:
								"line",

								data:{
									labels:
									mainCurve.curve.map(
										p => p.volume
									),

									datasets:
									datasets
								},

								options:{
									responsive:
									true,

									plugins:{
										legend:{
											display:
											true,

											position:
											"top"
										},

										tooltip:{
											mode:
											"index",

											intersect:
											false
										}
									},

									interaction:{
										mode:
										"nearest",

										axis:
										"x",

										intersect:
										false
									},

									scales:{
										x:{
											title:{
												display:
												true,

												text:
												"Volume % Distilled"
											}
										},

										y:{
											title:{
												display:
												true,

												text:
												"Temperature, °F"
											}
										}
									}
								}
							}
						);
					}
  /**/
}
