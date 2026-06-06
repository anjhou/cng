window.SystemInfo = class SystemInfo {
  static getTimestamp(){
    return new Date().toLocaleString("en-US", {
      year:"numeric",
      month:"2-digit",
      day:"2-digit",
      hour:"2-digit",
      minute:"2-digit",
      second:"2-digit",
      timeZoneName:"short"
    });
  }

  static getRunId(){
    if(window.crypto && crypto.randomUUID){
      return crypto.randomUUID();
    }
    return "RUN-" + Date.now();
  }

  static getComputerName(){
    const userValue = document.getElementById("computerName")?.value;
    if(userValue && userValue.trim() !== ""){
      return userValue.trim();
    }
    return window.location.hostname || navigator.platform || "Unknown";
  }

  static getEngineerName(){
    return document.getElementById("engineerName")?.value || "";
  }

  static getProjectName(){
    return document.getElementById("projectName")?.value || "CDU / VDU Study";
  }
};
