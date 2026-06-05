class PengRobinsonEOS{static kWilson(TF,P,c){const Tr=(TF+459.67)/c.tc;return (c.pc/P)*Math.exp(5.37*(1+c.omega)*(1-1/Tr))}static zFactor(){return 1}}
