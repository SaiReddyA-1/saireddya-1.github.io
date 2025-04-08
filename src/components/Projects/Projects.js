import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import ProjectCard from "./ProjectCards";
import Particle from "../Particle";
import nftMint from "../../Assets/Projects/nft mint.png";
import editor from "../../Assets/Projects/codeEditor.png";
import xAI from "../../Assets/Projects/xAi.png";
import bitsOfCode from "../../Assets/Projects/blog.png";
import linkedInBot from "../../Assets/Projects/linkedInBot.png";
import nxtTrendz from "../../Assets/Projects/nxtTrendz.png";

function Projects() {
  return (
    <Container fluid className="project-section">
      <Particle />
      <Container>
        <h1 className="project-heading">
          My Recent <strong className="purple">Works </strong>
        </h1>
        <p style={{ color: "white" }}>
          Here are a few projects I've worked on recently.
        </p>
        <Row style={{ justifyContent: "center", paddingBottom: "10px" }}>
          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={xAI} 
              isBlog={false}
              title="xAI Chatbot"
              description="An open-source AI chatbot built with Next.js, Vercel AI SDK, and xAI. Supports streaming responses, tool integration (like weather), reasoning model support, and a responsive UI with shadcn/ui and Tailwind CSS. Powered by the latest Next.js App Router."
              ghLink="https://github.com/SaiReddyA-1/xAI-SaiReddy"
              demoLink="https://saireddy-xai.vercel.app/" 
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={bitsOfCode}
              isBlog={false}
              title="Bits-0f-C0de"
              description="My personal blog page build with Next.js and Tailwind Css which takes the content from makdown files and renders it using Next.js. Supports dark mode and easy to write blogs using markdown."
              ghLink="https://github.com/SaiReddyA-1/Bits-0f-C0de"
              demoLink="https://saireddyblogs.vercel.app/"
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={linkedInBot} 
              isBlog={false}
              title="AI-Powered LinkedIn Automation Agent"
              description="An AI-based automation agent that streamlines LinkedIn lead generation using Google API and Playwright. It automates profile discovery, connection requests, and personalized messaging. Upcoming features include an email outreach module with attachments."
              ghLink="https://github.com/SaiReddyA-1/Linked-Automation"
              demoLink="https://v0-front-end-application-design.vercel.app/"
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={editor}
              isBlog={false}
              title="Editor.io"
              description="Online code and markdown editor build with react.js. Online Editor which supports html, css, and js code with instant view of website. Online markdown editor for building README file which supports GFM, Custom Html tags with toolbar and instant preview.Both the editor supports auto save of work using Local Storage"
              ghLink="https://github.com/SaiReddyA-1/Editor.io/"
              demoLink="https://editor0saireddy.ccbp.tech/"              
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={nxtTrendz}
              isBlog={false}
              title="Nxt Trendz - Cart Features"
              description="An e-commerce app that replicates cart functionality like Amazon/Flipkart. It includes JWT-based authentication, cart item quantity updates, price calculations, and an empty cart view. Built using React, React Router, and Context API."
              ghLink="https://github.com/SaiReddyA-1/Nxt-Trendz"
              demoLink="https://sai0trends.ccbp.tech/"
            />
          </Col>

          <Col md={4} className="project-card">
            <ProjectCard
              imgPath={nftMint} 
              isBlog={false}
              title="Web-Based NFT Mint"
              description="A static web-based NFT minting application built using HTML, CSS, and JavaScript. Deployed on Vercel and GitHub Pages, it allows users to mint NFTs through a clean, responsive UI."
              ghLink="https://github.com/SaiReddyA-1/Web-Based-NFT-MINT"
              demoLink="https://sai-nft-mint.vercel.app/"
            />
          </Col>
        </Row>
      </Container>
    </Container>
  );
}

export default Projects;
