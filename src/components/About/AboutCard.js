import React from "react";
import Card from "react-bootstrap/Card";
import { ImPointRight } from "react-icons/im";

function AboutCard() {
  return (
    <Card className="quote-card-view">
      <Card.Body>
        <blockquote className="blockquote mb-0">
          <p style={{ textAlign: "justify" }}>
            Hi Everyone, I am <span className="purple">Sai Reddy A </span>
            from <span className="purple"> Rajahmundry, India.</span>
            <br />
            I am currently pursuing BTech in Computer Science and Engineering with a specialization in Data Science(CSE-DS) at Aditya College of Engineering & Technology(ACET)-Surampalem.
            <br />
            I’m passionate about building impactful software solutions and exploring Artificial Intelligence, web development, and emerging technologies. Always eager to learn, innovate, and collaborate on exciting projects!
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
          <footer className="blockquote-footer">Sai Readdy</footer>
        </blockquote>
      </Card.Body>
    </Card>
  );
}

export default AboutCard;
