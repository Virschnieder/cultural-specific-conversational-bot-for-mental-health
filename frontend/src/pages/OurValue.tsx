import React from "react";
import "./OurValue.css";

const OurValue: React.FC = () => (
  <div className="ourvalue-bg">
    <div className="ourvalue-container">
      <div className="ourvalue-verse-arabic">
        وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ
      </div>
      <div className="ourvalue-verse-english">
        "And whoever relies upon Allah - then He is sufficient for him."
      </div>
      <div className="ourvalue-verse-ref">Quran 65:3</div>
      <div className="ourvalue-divider"></div>
      <div className="ourvalue-message">
        Seeking help for mental health is not only permissible in Islam but encouraged. Taking care of your mental wellness is part of taking care of the body and soul that Allah has entrusted to you.
      </div>
    </div>
  </div>
);

export default OurValue;
