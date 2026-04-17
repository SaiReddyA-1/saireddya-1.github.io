import React from "react";
import Card from "react-bootstrap/Card";
import { ImPointRight } from "react-icons/im";

function AboutCard() {
  return (
    <Card className="quote-card-view">
      <Card.Body>
        <blockquote className="blockquote mb-0">
          <p style={{ textAlign: "justify" }}>
            Hi Everyone, I am <span className="purple">SaiReddy Annamareddy </span>
            from <span className="purple"> Vijayawada, Andhra Pradesh.</span>
            <br />
            I am a CS graduate (2026) specializing in AI/ML & Data Science from Aditya College of Engineering & Technology (ACET), Surampalem with a CGPA of 7.5/10.
            <br />
            <br />
            With <span className="purple">13+ months</span> of professional experience, I've worked as a Software Engineer Intern at <span className="purple">EverUptime Technologies</span> building production microservices under strict 2-second SLA constraints, and at <span className="purple">Growstack Inc.</span> designing AI agents, RAG pipelines, and LLM-driven workflow automation.
            <br />
            <br />
            Apart from coding, some other activities that I love to do!
          </p>
          <ul>
            <li className="about-activity">
              <ImPointRight /> Playing Games
            </li>
            <li className="about-activity">
              <ImPointRight /> Writing Tech Blogs
            </li>
            <li className="about-activity">
              <ImPointRight /> Travelling
            </li>
          </ul>

          <p style={{ color: "rgb(155 126 172)" }}>
            "Strive to build things that make a difference!"{" "}
          </p>
          <footer className="blockquote-footer">SaiReddy Annamareddy</footer>
        </blockquote>
      </Card.Body>
    </Card>
  );
}

export default AboutCard;
